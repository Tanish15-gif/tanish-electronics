using System;
using System.Collections.Generic;

namespace TanishElectronics.Api.Entities;

public partial class ProductCondition
{
    public int ProductConditionId { get; set; }

    public string ConditionName { get; set; } = null!;

    public string? Description { get; set; }

    public virtual ICollection<Product> Products { get; set; } = new List<Product>();
}
