namespace TanishElectronics.Api.Settings;

public class GroqSettings
{
    public const string SectionName = "Groq";

    public string ApiKey { get; set; } = string.Empty;

    public string Model { get; set; } = "openai/gpt-oss-20b";

    public int MaxTokens { get; set; } = 400;
}