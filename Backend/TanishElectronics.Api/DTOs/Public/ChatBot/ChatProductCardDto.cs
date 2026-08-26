namespace TanishElectronics.Api.DTOs.Public.ChatBot;

public class ChatProductCardDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string ConditionName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public bool IsAvailable { get; set; }
    public string? PrimaryImageUrl { get; set; }
}