using System;
using System.Collections.Generic;

namespace TanishElectronics.Api.Entities;

public partial class EnquiryStatus
{
    public int EnquiryStatusId { get; set; }

    public string StatusName { get; set; } = null!;

    public int SortOrder { get; set; }

    public bool IsActive { get; set; }

    public virtual ICollection<Enquiry> Enquiries { get; set; } = new List<Enquiry>();
}
