namespace TanishElectronics.Api.DTOs.Products;

public class ProductCreatedDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = "";
    public string Message { get; set; } = "";
}