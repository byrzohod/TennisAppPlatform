using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Linq;
using System.Net.Http;
using TennisApp.API;
using TennisApp.Infrastructure.Data;

namespace TennisApp.Tests.Integration;

public abstract class IntegrationTestBase : IDisposable
{
    protected readonly HttpClient Client;
    private readonly WebApplicationFactory<Program> _factory;
    private readonly SqliteConnection _connection;

    protected IntegrationTestBase()
    {
        // Create unique in-memory database for this test
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

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

                    // Add DbContext using in-memory database for tests
                    services.AddDbContext<AppDbContext>(options =>
                    {
                        options.UseSqlite(_connection);
                    });

                    // Build service provider
                    var sp = services.BuildServiceProvider();

                    // Create scope and get the database context
                    using (var scope = sp.CreateScope())
                    {
                        var scopedServices = scope.ServiceProvider;
                        var db = scopedServices.GetRequiredService<AppDbContext>();

                        // Ensure database is created
                        db.Database.EnsureCreated();
                    }
                });
            });

        Client = _factory.CreateClient();
    }

    public void Dispose()
    {
        Client?.Dispose();
        _factory?.Dispose();
        _connection?.Dispose();
    }
}