using System.ComponentModel.DataAnnotations;

namespace TanishElectronics.Api.DTOs.Admin.StoreKnowledge;

public class UpdateStoreKnowledgeDto
{
    [Required(ErrorMessage = "Title is required")]
    [MaxLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
    public string Title { get; set; } = null!;

    [Required(ErrorMessage = "Category is required")]
    [MaxLength(60, ErrorMessage = "Category cannot exceed 60 characters")]
    public string Category { get; set; } = null!;

    [Required(ErrorMessage = "Content is required")]
    public string Content { get; set; } = null!;

    [MaxLength(250, ErrorMessage = "Tags cannot exceed 250 characters")]
    public string? Tags { get; set; }

    public bool IsActive { get; set; } = true;
}