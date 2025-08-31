using Microsoft.EntityFrameworkCore;
using TennisApp.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();

// Configure CORS (simple version)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Configure PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
});

var app = builder.Build();

// Configure pipeline (minimal)
app.UseCors("AllowAngularApp");
app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => "API is running with PostgreSQL!");

app.Run();