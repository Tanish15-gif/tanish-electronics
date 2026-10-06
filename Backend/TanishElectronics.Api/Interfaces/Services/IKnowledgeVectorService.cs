namespace TanishElectronics.Api.Interfaces.Services;

public record KnowledgeSearchResult(
    int StoreKnowledgeId,
    string Title,
    string Category,
    string Content,
    string? Tags,
    float RelevanceScore
);

public interface IKnowledgeVectorService
{
    /// <summary>
    /// Performs semantic vector search across StoreKnowledge articles using vector space modeling and cosine similarity.
    /// </summary>
    /// <param name="query">The user query or chat message.</param>
    /// <param name="topK">The maximum number of relevant knowledge articles to retrieve.</param>
    /// <param name="minScore">The minimum relevance threshold (0.0 to 1.0).</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task<IReadOnlyList<KnowledgeSearchResult>> SearchAsync(
        string query,
        int topK = 3,
        float minScore = 0.15f,
        CancellationToken cancellationToken = default
    );

    /// <summary>
    /// Evicts the cached knowledge index to force re-vectorization on the next search.
    /// </summary>
    Task InvalidateCacheAsync();
}

