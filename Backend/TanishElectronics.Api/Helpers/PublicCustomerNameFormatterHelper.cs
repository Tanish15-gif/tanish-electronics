namespace TanishElectronics.Api.Helpers;

public class PublicCustomerNameFormatterHelper
{
    public static string Format(string fullName)
    {
        var parts = fullName
            .Trim()
            .Split(" ", StringSplitOptions.RemoveEmptyEntries);

        if (parts.Length == 0) return "Customer";

        if (parts.Length == 1) return parts[0];

        return $"{parts[0]} {parts[1][0]}.";
    }
}