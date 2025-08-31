using System.Net;
using System.Text.Json;
using Serilog;

namespace TennisApp.API.Middleware;

public class GlobalExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlingMiddleware> _logger;

    public GlobalExceptionHandlingMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        // Log the exception with Serilog
        Log.Error(exception, "An unhandled exception occurred while processing {RequestPath}", context.Request.Path);
        
        context.Response.ContentType = "application/json";
        
        var response = new ErrorResponse
        {
            TraceId = context.TraceIdentifier,
            Timestamp = DateTime.UtcNow
        };

        switch (exception)
        {
            case ArgumentNullException:
            case ArgumentException:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                response.Message = "Invalid request parameters";
                response.Details = exception.Message;
                break;
            
            case KeyNotFoundException:
            case FileNotFoundException:
                context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                response.Message = "Resource not found";
                response.Details = exception.Message;
                break;
            
            case UnauthorizedAccessException:
                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                response.Message = "Unauthorized access";
                break;
            
            case NotImplementedException:
                context.Response.StatusCode = (int)HttpStatusCode.NotImplemented;
                response.Message = "Feature not implemented";
                break;
            
            case TimeoutException:
                context.Response.StatusCode = (int)HttpStatusCode.RequestTimeout;
                response.Message = "Request timeout";
                break;
            
            case InvalidOperationException:
                context.Response.StatusCode = (int)HttpStatusCode.Conflict;
                response.Message = "Operation conflict";
                response.Details = exception.Message;
                break;
            
            default:
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                response.Message = "An error occurred while processing your request";
                
                // Include exception details in development and test environments
                var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
                if (environment == "Development" || environment == "Test")
                {
                    response.Details = exception.Message;
                    response.StackTrace = exception.StackTrace;
                }
                break;
        }

        // Log different levels based on status code
        if (context.Response.StatusCode >= 500)
        {
            _logger.LogError(exception, "Server error occurred: {StatusCode} - {Message}", 
                context.Response.StatusCode, response.Message);
        }
        else if (context.Response.StatusCode >= 400)
        {
            _logger.LogWarning("Client error occurred: {StatusCode} - {Message} - {Path}", 
                context.Response.StatusCode, response.Message, context.Request.Path);
        }

        var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        });

        await context.Response.WriteAsync(jsonResponse);
    }
}

public class ErrorResponse
{
    public string Message { get; set; } = string.Empty;
    public string? Details { get; set; }
    public string TraceId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string? StackTrace { get; set; }
}