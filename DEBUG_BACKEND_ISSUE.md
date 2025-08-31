# Debug Backend API Connectivity Issue

## Problem
- Frontend requests to `http://localhost:5221` are timing out/freezing
- Backend appears to accept connections but doesn't respond
- CORS preflight requests hang indefinitely

## Quick Diagnostics

### 1. Test if backend is running
```bash
cd TennisApp/TennisApp.API
dotnet run

# In another terminal:
curl -v http://localhost:5221
```

### 2. Check for common issues

#### Database Connection
The app might be hanging on database operations. Check:
- SQLite database file permissions
- Entity Framework configuration
- Migration status

```bash
# Check if database exists and is accessible
ls -la TennisApp.db
```

#### Serilog Configuration
The logging configuration might be causing deadlocks:
```csharp
// Temporarily disable file logging in Program.cs
.WriteTo.Console() // Keep only this
// .WriteTo.File(...) // Comment out temporarily
```

#### Middleware Pipeline
The middleware order might be causing issues:
```csharp
// Ensure this order in Program.cs:
app.UseMiddleware<GlobalExceptionHandlingMiddleware>();
app.UseSerilogRequestLogging();
app.UseHttpsRedirection();
app.UseCors("AllowAngularApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
```

## Potential Solutions

### Solution 1: Minimal Configuration Test
Create a minimal version to isolate the issue:

```csharp
// Minimal Program.cs for testing
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors("AllowAngularApp");
app.MapControllers();

// Simple test endpoint
app.MapGet("/health", () => "API is running");

app.Run();
```

### Solution 2: Check Entity Framework
The issue might be with EF Core trying to connect to the database:

```bash
# Test database connection
dotnet ef database update --verbose
```

### Solution 3: Disable Authentication Temporarily
Comment out JWT configuration to see if that's the issue:

```csharp
// Comment out temporarily:
// builder.Services.AddAuthentication(...)
// builder.Services.AddAuthorization();
// app.UseAuthentication();
// app.UseAuthorization();
```

## Expected Behavior
After fixing, you should see:
- `curl http://localhost:5221/health` returns "API is running"
- Registration requests complete successfully
- CORS preflight requests return proper headers

## Next Steps After Fix
1. Re-enable disabled features one by one
2. Run E2E tests to verify functionality
3. Proceed with PostgreSQL migration for better reliability