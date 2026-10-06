using System.Collections.Concurrent;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Services;

public class KnowledgeVectorService : IKnowledgeVectorService
{
    private readonly TanishElectronicsDbContext _dbContext;
    private readonly IAppMemoryCacheService _cacheService;
    private readonly ILogger<KnowledgeVectorService> _logger;

    private const string CacheKey = "rag:knowledge:vector-index";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(10);

    private static readonly Regex TokenRegex = new(@"\b[a-z0-9]{2,}\b", RegexOptions.Compiled);

    private static readonly HashSet<string> StopWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
        "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but",
        "by", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from",
        "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself", "him",
        "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", "me",
        "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on", "once", "only",
        "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "she",
        "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves",
        "then", "there", "these", "they", "this", "those", "through", "to", "too", "under", "until",
        "up", "very", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom",
        "why", "with", "would", "you", "your", "yours", "yourself", "yourselves"
    };

    private static readonly Dictionary<string, string[]> DomainSynonyms = new(StringComparer.OrdinalIgnoreCase)
    {
        { "sound", new[] { "audio", "speaker", "volume", "hearing" } },
        { "picture", new[] { "display", "screen", "video", "image", "panel" } },
        { "display", new[] { "screen", "panel", "picture", "video" } },
        { "screen", new[] { "panel", "display", "picture" } },
        { "black", new[] { "dark", "dim", "blank", "no picture" } },
        { "backlight", new[] { "led strip", "inverter", "led light", "black screen" } },
        { "lines", new[] { "vertical lines", "horizontal lines", "bars", "t-con", "distortion", "ghosting" } },
        { "broken", new[] { "cracked", "damage", "fracture", "shattered", "impact" } },
        { "warranty", new[] { "guarantee", "guaranty", "coverage", "terms", "free repair" } },
        { "visit", new[] { "home visit", "doorstep", "technician", "suburbs", "area" } },
        { "home", new[] { "home visit", "doorstep", "house", "residence" } },
        { "turnaround", new[] { "timeline", "duration", "how long", "time taken", "hours", "days" } },
        { "drop", new[] { "drop off", "workshop", "shop", "visit shop" } },
        { "power", new[] { "turn on", "starting", "dead", "boot loop", "red light", "standby" } },
        { "remote", new[] { "magic remote", "smart remote", "controller", "pairing" } },
        { "adapter", new[] { "power supply", "charger", "19v", "12v", "cable" } },
        { "refurbished", new[] { "second hand", "used", "pre-owned", "certified" } }
    };

    public KnowledgeVectorService(
        TanishElectronicsDbContext dbContext,
        IAppMemoryCacheService cacheService,
        ILogger<KnowledgeVectorService> logger)
    {
        _dbContext = dbContext;
        _cacheService = cacheService;
        _logger = logger;
    }

    public async Task<IReadOnlyList<KnowledgeSearchResult>> SearchAsync(
        string query,
        int topK = 3,
        float minScore = 0.15f,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return Array.Empty<KnowledgeSearchResult>();
        }

        try
        {
            var vectorIndex = await GetOrBuildIndexAsync(cancellationToken);
            if (vectorIndex == null || vectorIndex.Documents.Count == 0)
            {
                return Array.Empty<KnowledgeSearchResult>();
            }

            var queryVector = BuildQueryVector(query, vectorIndex.Vocabulary, vectorIndex.IdfMap);
            if (queryVector.Count == 0)
            {
                return Array.Empty<KnowledgeSearchResult>();
            }

            var results = new List<KnowledgeSearchResult>();

            foreach (var doc in vectorIndex.Documents)
            {
                var similarity = ComputeCosineSimilarity(queryVector, doc.Vector);
                if (similarity >= minScore)
                {
                    results.Add(new KnowledgeSearchResult(
                        doc.StoreKnowledgeId,
                        doc.Title,
                        doc.Category,
                        doc.Content,
                        doc.Tags,
                        similarity
                    ));
                }
            }

            return results
                .OrderByDescending(r => r.RelevanceScore)
                .Take(topK)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to perform semantic vector search for query: {Query}", query);
            return Array.Empty<KnowledgeSearchResult>();
        }
    }

    public Task InvalidateCacheAsync()
    {
        _cacheService.Remove(CacheKey);
        return Task.CompletedTask;
    }

    private async Task<KnowledgeVectorIndex> GetOrBuildIndexAsync(CancellationToken cancellationToken)
    {
        return await _cacheService.GetOrCreateAsync(
            CacheKey,
            async () =>
            {
                var articles = await _dbContext.StoreKnowledges
                    .AsNoTracking()
                    .Where(k => k.IsActive)
                    .ToListAsync(cancellationToken);

                return BuildIndex(articles);
            },
            CacheDuration
        );
    }

    private static KnowledgeVectorIndex BuildIndex(List<StoreKnowledge> articles)
    {
        if (articles.Count == 0)
        {
            return new KnowledgeVectorIndex(new List<VectorDocument>(), new Dictionary<string, int>(), new Dictionary<string, float>());
        }

        var vocabulary = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var docFrequency = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        var preprocessedDocs = new List<(StoreKnowledge Article, List<string> WeightedTokens)>();

        foreach (var a in articles)
        {
            var weightedTokens = new List<string>();

            // Title terms boosted x2.5
            var titleTokens = TokenizeAndExpand(a.Title);
            for (int i = 0; i < 2; i++) weightedTokens.AddRange(titleTokens);

            // Tags boosted x2.0
            if (!string.IsNullOrWhiteSpace(a.Tags))
            {
                var tagTokens = TokenizeAndExpand(a.Tags);
                for (int i = 0; i < 2; i++) weightedTokens.AddRange(tagTokens);
            }

            // Category
            weightedTokens.AddRange(TokenizeAndExpand(a.Category));

            // Content terms
            weightedTokens.AddRange(TokenizeAndExpand(a.Content));

            preprocessedDocs.Add((a, weightedTokens));

            // Count unique terms per document for IDF
            var distinctInDoc = weightedTokens.Distinct(StringComparer.OrdinalIgnoreCase);
            foreach (var token in distinctInDoc)
            {
                if (!vocabulary.ContainsKey(token))
                {
                    vocabulary[token] = vocabulary.Count;
                }
                docFrequency[token] = docFrequency.GetValueOrDefault(token) + 1;
            }
        }

        // Compute IDF: ln(1 + (N - nt + 0.5) / (nt + 0.5))
        var totalDocs = articles.Count;
        var idfMap = new Dictionary<string, float>(StringComparer.OrdinalIgnoreCase);
        foreach (var (token, freq) in docFrequency)
        {
            var idf = (float)Math.Log(1.0 + (totalDocs - freq + 0.5) / (freq + 0.5));
            idfMap[token] = Math.Max(0.1f, idf);
        }

        // Build document vectors with L2 normalization
        var vectorDocs = new List<VectorDocument>();
        foreach (var (article, tokens) in preprocessedDocs)
        {
            var termCounts = new Dictionary<string, float>(StringComparer.OrdinalIgnoreCase);
            foreach (var t in tokens)
            {
                termCounts[t] = termCounts.GetValueOrDefault(t) + 1.0f;
            }

            var vector = new Dictionary<int, float>();
            float sumSq = 0f;

            foreach (var (term, count) in termCounts)
            {
                if (vocabulary.TryGetValue(term, out var termIdx))
                {
                    var idf = idfMap.GetValueOrDefault(term, 1.0f);
                    var tf = 1.0f + (float)Math.Log(count);
                    var weight = tf * idf;
                    vector[termIdx] = weight;
                    sumSq += weight * weight;
                }
            }

            // Normalize vector to unit length (L2 norm)
            if (sumSq > 0)
            {
                var norm = (float)Math.Sqrt(sumSq);
                foreach (var k in vector.Keys.ToList())
                {
                    vector[k] /= norm;
                }
            }

            vectorDocs.Add(new VectorDocument(
                article.StoreKnowledgeId,
                article.Title,
                article.Category,
                article.Content,
                article.Tags,
                vector
            ));
        }

        return new KnowledgeVectorIndex(vectorDocs, vocabulary, idfMap);
    }

    private static Dictionary<int, float> BuildQueryVector(
        string query,
        Dictionary<string, int> vocabulary,
        Dictionary<string, float> idfMap)
    {
        var tokens = TokenizeAndExpand(query);
        if (tokens.Count == 0) return new Dictionary<int, float>();

        var termCounts = new Dictionary<string, float>(StringComparer.OrdinalIgnoreCase);
        foreach (var t in tokens)
        {
            termCounts[t] = termCounts.GetValueOrDefault(t) + 1.0f;
        }

        var vector = new Dictionary<int, float>();
        float sumSq = 0f;

        foreach (var (term, count) in termCounts)
        {
            if (vocabulary.TryGetValue(term, out var termIdx))
            {
                var idf = idfMap.GetValueOrDefault(term, 1.0f);
                var tf = 1.0f + (float)Math.Log(count);
                var weight = tf * idf;
                vector[termIdx] = weight;
                sumSq += weight * weight;
            }
        }

        if (sumSq > 0)
        {
            var norm = (float)Math.Sqrt(sumSq);
            foreach (var k in vector.Keys.ToList())
            {
                vector[k] /= norm;
            }
        }

        return vector;
    }

    private static float ComputeCosineSimilarity(
        Dictionary<int, float> queryVector,
        Dictionary<int, float> docVector)
    {
        float dotProduct = 0f;

        // Iterate through the smaller vector for optimal speed
        if (queryVector.Count <= docVector.Count)
        {
            foreach (var (idx, qVal) in queryVector)
            {
                if (docVector.TryGetValue(idx, out var dVal))
                {
                    dotProduct += qVal * dVal;
                }
            }
        }
        else
        {
            foreach (var (idx, dVal) in docVector)
            {
                if (queryVector.TryGetValue(idx, out var qVal))
                {
                    dotProduct += qVal * dVal;
                }
            }
        }

        return dotProduct;
    }

    private static List<string> TokenizeAndExpand(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return new List<string>();

        var lower = text.ToLowerInvariant();
        var matches = TokenRegex.Matches(lower);
        var baseTokens = new List<string>();

        for (int i = 0; i < matches.Count; i++)
        {
            var val = matches[i].Value;
            if (!StopWords.Contains(val))
            {
                baseTokens.Add(val);
            }
        }

        // Add bigrams for key phrases (e.g., "black screen", "no picture", "home visit")
        var expanded = new List<string>(baseTokens);
        for (int i = 0; i < baseTokens.Count - 1; i++)
        {
            expanded.Add($"{baseTokens[i]}_{baseTokens[i + 1]}");
        }

        // Expand domain synonyms
        foreach (var token in baseTokens)
        {
            if (DomainSynonyms.TryGetValue(token, out var synonyms))
            {
                foreach (var syn in synonyms)
                {
                    expanded.Add(syn.Replace(" ", "_"));
                }
            }
        }

        return expanded;
    }

    private record VectorDocument(
        int StoreKnowledgeId,
        string Title,
        string Category,
        string Content,
        string? Tags,
        Dictionary<int, float> Vector
    );

    private record KnowledgeVectorIndex(
        List<VectorDocument> Documents,
        Dictionary<string, int> Vocabulary,
        Dictionary<string, float> IdfMap
    );
}

