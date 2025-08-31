using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using System;
using System.Net.Http;
using System.Threading.Tasks;
using Testcontainers.PostgreSql;
using TennisApp.API;
using TennisApp.Infrastructure.Data;

namespace TennisApp.Tests.Integration;

public abstract class IntegrationTestBase : IAsyncLifetime
{
    protected HttpClient Client { get; private set; } = null!;
    private WebApplicationFactory<Program> _factory = null!;
    private readonly PostgreSqlContainer _postgresContainer;

    protected IntegrationTestBase()
    {
        // Create PostgreSQL test container
        _postgresContainer = new PostgreSqlBuilder()
            .WithImage("postgres:15-alpine")
            .WithDatabase("testdb")
            .WithUsername("testuser")
            .WithPassword("testpass")
            .Build();
    }

    public async Task InitializeAsync()
    {
        // Start the PostgreSQL container
        await _postgresContainer.StartAsync();

        // Get the connection string from the container
        var connectionString = _postgresContainer.GetConnectionString();

        // Create and configure the factory with the test database
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

                    // Add DbContext using test PostgreSQL database
                    services.AddDbContext<AppDbContext>(options =>
                    {
                        options.UseNpgsql(connectionString);
                        options.EnableSensitiveDataLogging();
                        options.EnableDetailedErrors();
                    });
                });
            });

        // Create the client
        Client = _factory.CreateClient();

        // Ensure database is created
        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await dbContext.Database.EnsureCreatedAsync();
        }
    }

    public async Task DisposeAsync()
    {
        Client?.Dispose();
        _factory?.Dispose();
        await _postgresContainer.DisposeAsync();
    }
}