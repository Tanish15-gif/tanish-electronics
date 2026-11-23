using System.Security.Cryptography;

namespace TanishElectronics.Api.Middleware;

public sealed class ChatSessionOwnershipMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Path.StartsWithSegments("/public/chat"))
        {
            var owner = context.Request.Cookies["te_chat_owner"];
            if (string.IsNullOrEmpty(owner) || owner.Length != 64 || !owner.All(Uri.IsHexDigit))
            {
                owner = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
                context.Response.Cookies.Append("te_chat_owner", owner, new CookieOptions
                { HttpOnly = true, Secure = context.Request.IsHttps, SameSite = SameSiteMode.Strict, Path = "/", MaxAge = TimeSpan.FromDays(1) });
            }
            context.Items["ChatOwner"] = owner;
        }
        await next(context);
    }
}
