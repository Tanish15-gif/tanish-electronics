using System.Text;

namespace TanishElectronics.Api.Helpers;

public static class CsvExportHelper
{
    public static byte[] BuildCsv(
        IEnumerable<string> headers,
        IEnumerable<IEnumerable<string?>> rows
    )
    {
        var builder = new StringBuilder();

        builder.Append(BuildLine(headers));
        builder.Append("\r\n");

        foreach (var row in rows)
        {
            builder.Append(BuildLine(row));
            builder.Append("\r\n");
        }

        var csvText = "\uFEFF" + builder.ToString();

        return Encoding.UTF8.GetBytes(csvText);
    }

    private static string BuildLine(IEnumerable<string?> values)
    {
        return string.Join(",", values.Select(Escape));
    }

    private static string Escape(string? value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return "";
        }

        // Spreadsheet applications can interpret formulas even after leading whitespace.
        var significant = value.TrimStart();
        if (value[0] is '\t' or '\r' or '\n' ||
            (significant.Length > 0 && significant[0] is '=' or '+' or '-' or '@'))
            value = "'" + value;

        var escapedValue = value.Replace("\"", "\"\"");

        if (
            escapedValue.Contains(",") ||
            escapedValue.Contains("\"") ||
            escapedValue.Contains("\n") ||
            escapedValue.Contains("\r")
        )
        {
            return $"\"{escapedValue}\"";
        }

        return escapedValue;
    }
}
