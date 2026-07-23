namespace TanishElectronics.Api.DTOs.Admin.Products;

public class AdminProductQueryDto
{
    public int? CategoryId { get; set; }

    public int? ConditionId { get; set; }

    public string? Search { get; set; }

    public int PageNumber { get; set; } = 1;

    public int PageSize { get; set; } = 10;
}