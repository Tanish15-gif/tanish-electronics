namespace TanishElectronics.Api.Helpers;

public class AnnouncementAudienceMatcherHelper
{
    public static bool Matches(string announcementAudience, string requestedAudience)
    {
        if (string.IsNullOrWhiteSpace(announcementAudience)) return false;

        if (announcementAudience.Equals("All", StringComparison.OrdinalIgnoreCase)) return true;

        return announcementAudience.Equals(requestedAudience, StringComparison.OrdinalIgnoreCase);
    }
}