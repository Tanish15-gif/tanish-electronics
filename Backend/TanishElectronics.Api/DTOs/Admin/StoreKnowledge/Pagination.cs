namespace TanishElectronics.Api.DTOs.Admin.StoreKnowledge;

public class StoreKnowledgeItemDto
{
    public int StoreKnowledgeId { get; set; }
    public string Title { get; set; } = null!;
    public string Category { get; set; } = null!;
    public string Content { get; set; } = null!;
    public string? Tags { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class StoreKnowledgeQueryDto
{
    public string? Search { get; set; }
    public string? Category { get; set; }
    public bool? IsActive { get; set; }

    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 15;

    public int Page
    {
        get => PageNumber;
        set => PageNumber = value;
    }
}
