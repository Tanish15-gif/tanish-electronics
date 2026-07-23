using System;
using System.Collections.Generic;

namespace TanishElectronics.Api.Entities;

public partial class ServiceStatus
{
    public int ServiceStatusId { get; set; }

    public string StatusName { get; set; } = null!;

    public int SortOrder { get; set; }

    public bool IsActive { get; set; }

    public virtual ICollection<ServiceRequestStatusHistory> ServiceRequestStatusHistoryNewStatuses { get; set; } = new List<ServiceRequestStatusHistory>();

    public virtual ICollection<ServiceRequestStatusHistory> ServiceRequestStatusHistoryOldStatuses { get; set; } = new List<ServiceRequestStatusHistory>();

    public virtual ICollection<ServiceRequest> ServiceRequests { get; set; } = new List<ServiceRequest>();
}
