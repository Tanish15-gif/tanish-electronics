using SkiaSharp;
using TanishElectronics.Api.Exceptions;

namespace TanishElectronics.Api.Helpers;

public static class ImageUploadSecurity
{
    public const int MaxBytes = 5 * 1024 * 1024;
    public static async Task<byte[]> SanitizeAsync(IFormFile image)
    {
        if (image == null || image.Length <= 0 || image.Length > MaxBytes)
            throw new BadRequestException("Upload an image between 1 byte and 5 MB.");
        var extension = Path.GetExtension(image.FileName).ToLowerInvariant();
        if (extension is not (".jpg" or ".jpeg" or ".png" or ".webp"))
            throw new BadRequestException("Only JPG, PNG and WEBP images are allowed.");
        using var source = new MemoryStream();
        await image.CopyToAsync(source);
        using var data = SKData.CreateCopy(source.ToArray());
        using var codec = SKCodec.Create(data);
        if (codec == null || codec.EncodedFormat is not (SKEncodedImageFormat.Jpeg or SKEncodedImageFormat.Png or SKEncodedImageFormat.Webp) ||
            codec.Info.Width <= 0 || codec.Info.Height <= 0 || codec.Info.Width > 4096 || codec.Info.Height > 4096 ||
            (long)codec.Info.Width * codec.Info.Height > 8_000_000)
            throw new BadRequestException("Invalid image or image dimensions exceed the supported limit.");
        using var bitmap = new SKBitmap(codec.Info.Width, codec.Info.Height, SKColorType.Rgba8888, SKAlphaType.Premul);
        if (codec.GetPixels(bitmap.Info, bitmap.GetPixels()) != SKCodecResult.Success)
            throw new BadRequestException("The image is incomplete or cannot be decoded.");
        using var cleanImage = SKImage.FromBitmap(bitmap);
        using var encoded = cleanImage.Encode(SKEncodedImageFormat.Png, 100);
        if (encoded == null || encoded.Size > MaxBytes)
            throw new BadRequestException("The decoded image is too large. Upload a smaller image.");
        return encoded.ToArray();
    }
}
