using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using System;
using System.Linq;
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
                services.RemoveAll(typeof(DbContextOptions<AppDbContext>));

                // Add DbContext using test PostgreSQL database
                services.AddDbContext<AppDbContext>(options =>
                {
                    options.UseNpgsql(connectionString);
                });

                // Build service provider
                var sp = services.BuildServiceProvider();

                // Create scope and get the database context
                using (var scope = sp.CreateScope())
                {
                    var scopedServices = scope.ServiceProvider;
                    var db = scopedServices.GetRequiredService<AppDbContext>();

                    // Ensure database is created and migrated
                    db.Database.EnsureCreated();
                }
            });
        });

        // Recreate the client after reconfiguration
        Client = _factory.CreateClient();
    }

    public async Task DisposeAsync()
    {
        Client?.Dispose();
        _factory?.Dispose();
        await _postgresContainer.DisposeAsync();
    }
}