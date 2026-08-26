namespace TanishElectronics.Api.Settings;

public class GroqSettings
{
    public const string SectionName = "Groq";

    public string ApiKey { get; set; } = string.Empty;

    public string Model { get; set; } = "";

    public int MaxTokens { get; set; } = 400;
}