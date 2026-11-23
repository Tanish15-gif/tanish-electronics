namespace TanishElectronics.Api.Middleware;

// Public forms accept guests, but invalid supplied credentials must not silently become a guest submission.
public sealed class OptionalAuthenticationMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (HttpMethods.IsPost(context.Request.Method) &&
            (context.Request.Path.StartsWithSegments("/ServiceRequests") ||
             context.Request.Path.StartsWithSegments("/Enquiries") ||
             context.Request.Path.StartsWithSegments("/public/chat")) &&
            context.Request.Headers.Authorization.ToString().StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) &&
            context.User.Identity?.IsAuthenticated != true)
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(new { message = "Your session has ended. Please sign in again." });
            return;
        }
        await next(context);
    }
}
