namespace TanishElectronics.Api.Helpers;

public static class RepairRequestNumbers
{
    public static string Next(int year, IEnumerable<string> existing)
    {
        var prefix = $"TE-{year}-";
        var highest = existing.Where(n => n.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            .Select(n => n[prefix.Length..])
            .Where(n => n.Length > 0 && n.All(char.IsAsciiDigit))
            .Select(n => long.TryParse(n, out var value) ? value : 0)
            .DefaultIfEmpty().Max();
        return prefix + checked(highest + 1).ToString("D3", System.Globalization.CultureInfo.InvariantCulture);
    }
}
