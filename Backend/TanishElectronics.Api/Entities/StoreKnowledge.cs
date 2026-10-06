using System;

namespace TanishElectronics.Api.Entities;

public partial class StoreKnowledge
{
    public int StoreKnowledgeId { get; set; }

    public string Title { get; set; } = null!;

    public string Category { get; set; } = null!;

    public string Content { get; set; } = null!;

    public string? Tags { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}

