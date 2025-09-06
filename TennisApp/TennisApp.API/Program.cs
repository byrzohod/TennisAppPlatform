using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Serilog.Events;
using System.Text;
using TennisApp.Application.Mappings;
using TennisApp.Application.Services.Auth;
using TennisApp.Application.Services.Player;
using TennisApp.Application.Services.Tournament;
using TennisApp.API.Middleware;
using TennisApp.Infrastructure.Data;
using TennisApp.Infrastructure.Repositories.Base;
using TennisApp.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog only if not in test environment
if (!builder.Environment.IsEnvironment("Test"))
{
    Log.Logger = new LoggerConfiguration()
        .MinimumLevel.Debug()
        .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
        .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
        .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
        .Enrich.FromLogContext()
        .Enrich.WithProperty("Application", "TennisApp")
        .WriteTo.Console(
            outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
        .WriteTo.File(
            "logs/tennisapp-.log",
            rollingInterval: RollingInterval.Day,
            outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}",
            retainedFileCountLimit: 30)
        .CreateLogger();

    builder.Host.UseSerilog();
    Log.Information("Starting Tennis App API");

}

    // Add services to the container.
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();

    // Configure FluentValidation (validators only, no auto-validation for now)
    // builder.Services.AddFluentValidationAutoValidation();
    // builder.Services.AddFluentValidationClientsideAdapters();

    // Configure API Versioning
    builder.Services.AddApiVersioning(options =>
    {
        options.DefaultApiVersion = new Microsoft.AspNetCore.Mvc.ApiVersion(1, 0);
        options.AssumeDefaultVersionWhenUnspecified = true;
        options.ReportApiVersions = true;
        options.ApiVersionReader = Microsoft.AspNetCore.Mvc.Versioning.ApiVersionReader.Combine(
            new Microsoft.AspNetCore.Mvc.Versioning.UrlSegmentApiVersionReader(),
            new Microsoft.AspNetCore.Mvc.Versioning.HeaderApiVersionReader("X-Api-Version"),
            new Microsoft.AspNetCore.Mvc.Versioning.MediaTypeApiVersionReader("ver")
        );
    });

    builder.Services.AddVersionedApiExplorer(options =>
    {
        options.GroupNameFormat = "'v'VVV";
        options.SubstituteApiVersionInUrl = true;
    });

    // Configure Swagger
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
        {
            Title = "Tennis App API",
            Version = "v1",
            Description = "API for Tennis Tournament Management System",
            Contact = new Microsoft.OpenApi.Models.OpenApiContact
            {
                Name = "Tennis App Team",
                Email = "support@tennisapp.com"
            },
            License = new Microsoft.OpenApi.Models.OpenApiLicense
            {
                Name = "MIT License",
                Url = new Uri("https://opensource.org/licenses/MIT")
            }
        });

        // Add JWT Authentication
        var securityScheme = new Microsoft.OpenApi.Models.OpenApiSecurityScheme
        {
            Name = "JWT Authentication",
            Description = "Enter JWT Bearer token **_only_**",
            In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            Reference = new Microsoft.OpenApi.Models.OpenApiReference
            {
                Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                Id = "Bearer"
            }
        };

        options.AddSecurityDefinition("Bearer", securityScheme);
        options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
        {
        { securityScheme, new string[] { } }
        });

        // Use method name as operationId
        options.CustomOperationIds(apiDesc =>
        {
            if (apiDesc.ActionDescriptor is Microsoft.AspNetCore.Mvc.Controllers.ControllerActionDescriptor controllerActionDescriptor)
            {
                return controllerActionDescriptor.MethodInfo.Name;
            }
            return null;
        });
    });

    // Configure Database
    builder.Services.AddDbContext<AppDbContext>(options =>
    {
        if (builder.Environment.IsDevelopment())
        {
            // Use PostgreSQL for development
            options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
        }
        else
        {
            // Use PostgreSQL for production as well
            options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
        }
    });

    // Configure AutoMapper
    builder.Services.AddAutoMapper(typeof(AutoMapperProfile));

    // Configure FluentValidation
    builder.Services.AddValidatorsFromAssemblyContaining<AutoMapperProfile>();

    // Configure Repositories
    builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

    // Configure Services
    builder.Services.AddScoped<IPlayerService, PlayerService>();
    builder.Services.AddScoped<ITournamentService, TournamentService>();
    builder.Services.AddScoped<ITournamentRegistrationService, TournamentRegistrationService>();
    builder.Services.AddScoped<IAuthService, TennisApp.Application.Services.Auth.AuthService>();
    builder.Services.AddScoped<TennisApp.Application.Services.Match.IMatchService, TennisApp.Application.Services.Match.MatchService>();
    builder.Services.AddScoped<TennisApp.Application.Services.Bracket.IBracketService, TennisApp.Application.Services.Bracket.BracketService>();
    builder.Services.AddScoped<JwtService>();
    builder.Services.AddScoped<PasswordHasher>();

    // Configure JWT Authentication
    var jwtSecretKey = builder.Configuration["Jwt:SecretKey"] ?? "TennisApp_Super_Secret_Key_That_Should_Be_Changed_In_Production_2024";
    var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "TennisApp";
    var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "TennisAppUsers";

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)),
            ClockSkew = TimeSpan.Zero
        };
    });

    builder.Services.AddAuthorization();

    // Configure CORS
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAngularApp",
            policy =>
            {
                policy.WithOrigins("http://localhost:4200", "https://localhost:4200")
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials()
                    .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
            });
    });

    var app = builder.Build();

    // Log the current environment
    Log.Information($"Application starting in {app.Environment.EnvironmentName} environment");

    // Apply database migrations on startup (skip in integration test environment)
    // Integration tests handle their own database setup via TestContainers
    var skipMigrations = Environment.GetEnvironmentVariable("SKIP_MIGRATIONS") == "true";
    
    if (!skipMigrations)
    {
        using (var scope = app.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            try
            {
                Log.Information("Applying database migrations...");
                dbContext.Database.Migrate();
                Log.Information("Database migrations applied successfully");
            }
            catch (Exception ex)
            {
                Log.Error(ex, "An error occurred while applying database migrations");
                throw;
            }
        }
    }
    else
    {
        Log.Information("Skipping database migrations (SKIP_MIGRATIONS=true)");
    }

    // Configure Swagger UI
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "Tennis App API V1");
            options.RoutePrefix = string.Empty; // Set Swagger UI at the app's root
            options.DocumentTitle = "Tennis App API Documentation";
            options.DisplayRequestDuration();
            options.EnableDeepLinking();
            options.EnableFilter();
            options.ShowExtensions();
            options.EnableValidator();
        });
    }

    // Add global exception handling middleware
    app.UseMiddleware<GlobalExceptionHandlingMiddleware>();

    // Configure Serilog request logging (skip in test environment)
    if (!app.Environment.IsEnvironment("Test"))
    {
        app.UseSerilogRequestLogging(options =>
        {
            options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
            options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
            {
                diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value ?? "Unknown");
                diagnosticContext.Set("UserAgent", httpContext.Request.Headers.UserAgent.ToString() ?? "Unknown");
                diagnosticContext.Set("RemoteIP", httpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown");
            };
        });
    }

    app.UseHttpsRedirection();

    app.UseCors("AllowAngularApp");

    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();

    app.Run();

public partial class Program { }