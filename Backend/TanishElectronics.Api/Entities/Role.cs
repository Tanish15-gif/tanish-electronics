using System;
using System.Collections.Generic;

namespace TanishElectronics.Api.Entities;

public partial class Role
{
    public int RoleId { get; set; }

    public string RoleName { get; set; } = null!;

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<AppUserRole> AppUserRoles { get; set; } = new List<AppUserRole>();
}
