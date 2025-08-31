using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using TennisApp.API;
using TennisApp.Infrastructure.Data;
using Xunit;

namespace TennisApp.Tests.Integration;

[Collection("Database Collection")]
public abstract class IntegrationTestBase : IAsyncLifetime
{
    protected HttpClient Client { get; private set; } = null!;
    private WebApplicationFactory<Program> _factory = null!;
    private readonly SharedDatabaseFixture _fixture;

    protected IntegrationTestBase(SharedDatabaseFixture fixture)
    {
        _fixture = fixture;
    }

    public async Task InitializeAsync()
    {
        // Create and configure the factory with the shared test database
        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Remove the existing DbContext registration
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                    
                    if (descriptor != null)
                    {
                        services.Remove(descriptor);
                    }

                    // Add DbContext using shared test PostgreSQL database
                    services.AddDbContext<AppDbContext>(options =>
                    {
                        options.UseNpgsql(_fixture.ConnectionString);
                        options.EnableSensitiveDataLogging();
                        options.EnableDetailedErrors();
                    });
                });
            });

        // Create the client
        Client = _factory.CreateClient();

        // Clean database before test
        await CleanDatabaseAsync();
        
        // Seed test data if needed
        await SeedTestDataAsync();
    }

    public async Task DisposeAsync()
    {
        // Clean up database after test (create a new scope for cleanup)
        await CleanDatabaseAsync();
        
        Client?.Dispose();
        _factory?.Dispose();
    }
    
    private async Task CleanDatabaseAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        
        // Use raw SQL to truncate tables with CASCADE to handle foreign key constraints
        await dbContext.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"Matches\", \"TournamentPlayers\", \"Tournaments\", \"Players\" CASCADE");
    }
    
    protected virtual Task SeedTestDataAsync()
    {
        // Override in derived classes to seed test data
        return Task.CompletedTask;
    }
}