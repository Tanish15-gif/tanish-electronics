using System;
using System.Collections.Generic;

namespace TanishElectronics.Api.Entities;

public partial class EnquiryNote
{
    public int EnquiryNoteId { get; set; }

    public int EnquiryId { get; set; }

    public string Note { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual Enquiry Enquiry { get; set; } = null!;
}
