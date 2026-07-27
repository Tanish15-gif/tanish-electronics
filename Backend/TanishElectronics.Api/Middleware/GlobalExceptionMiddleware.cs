using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Exceptions;

namespace TanishElectronics.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly IWebHostEnvironment _environment;
    public GlobalExceptionMiddleware
    (
        RequestDelegate next,
        ILogger<GlobalExceptionMiddleware> logger,
        IWebHostEnvironment environment
    )
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            _logger.LogInformation(
                "Request was cancelled by the client. Path: {Path}",
                context.Request.Path
            );
        }
        catch (Exception ex)
        {
            if (context.Response.HasStarted)
            {
                _logger.LogError(
                    ex,
                    "Exception occurred after response started. Path: {Path}",
                    context.Request.Path
                );
                throw;
            }
            await HandleExceptionAsync(context, ex);
        }
    }
    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var statusCode = GetStatusCode(exception);

        if (statusCode >= 500)
        {
            _logger.LogError(
                exception,
                "Unhandled server error. StatusCode: {StatusCode}, Method: {Method}, Path: {Path}",
                statusCode,
                context.Request.Method,
                context.Request.Path
            );
        }
        else
        {
            _logger.LogWarning(
                "Handled request error. StatusCode: {StatusCode}, Method: {Method}, Path: {Path}, Message: {Message}",
                statusCode,
                context.Request.Method,
                context.Request.Path,
                exception.Message
            );
        }

        context.Response.Clear();
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        var response = new
        {
            statusCode,
            message = GetSafeMessage(exception, statusCode),
            traceId = context.TraceIdentifier,
            path = context.Request.Path.Value,
            method = context.Request.Method,
            detail = _environment.IsDevelopment() ? exception.Message : null
        };

        var json = JsonSerializer.Serialize(
            response,
            new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            }
        );

        await context.Response.WriteAsync(json);
    }
    private static int GetStatusCode(Exception exception)
    {
        return exception switch
        {
            KeyNotFoundException => StatusCodes.Status404NotFound,

            UnauthorizedAccessException => StatusCodes.Status401Unauthorized,
            ForbiddenAccessException => StatusCodes.Status403Forbidden,

            ConflictException => StatusCodes.Status409Conflict,
            DbUpdateConcurrencyException => StatusCodes.Status409Conflict,

            ArgumentException => StatusCodes.Status400BadRequest,
            BadRequestException => StatusCodes.Status400BadRequest,
            InvalidOperationException => StatusCodes.Status400BadRequest,
            ValidationException => StatusCodes.Status400BadRequest,
            BadHttpRequestException => StatusCodes.Status400BadRequest,

            TimeoutException => StatusCodes.Status503ServiceUnavailable,

            _ => StatusCodes.Status500InternalServerError
        };
    }
    private static string GetSafeMessage(Exception exception, int statusCode)
    {
        if (statusCode >= 500) return "Something went wrong. Please try again later.";

        return exception.Message;
    }
}