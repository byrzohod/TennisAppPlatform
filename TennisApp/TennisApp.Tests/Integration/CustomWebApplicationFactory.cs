using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TennisApp.Infrastructure.Data;
using System;
using System.Linq;

namespace TennisApp.Tests.Integration;

public class CustomWebApplicationFactory<TStartup> : WebApplicationFactory<TStartup>, IDisposable where TStartup : class
{
    private SqliteConnection? _connection;

    public CustomWebApplicationFactory()
    {
        // Create and open a SQLite in-memory database connection
        // This connection must remain open for the duration of the test
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
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

            // Add SQLite for integration tests
            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseSqlite(_connection!);
                options.EnableSensitiveDataLogging();
                options.EnableDetailedErrors();
            });

            // Build the service provider
            var sp = services.BuildServiceProvider();

            // Create a scope to obtain a reference to the database
            using (var scope = sp.CreateScope())
            {
                var scopedServices = scope.ServiceProvider;
                var db = scopedServices.GetRequiredService<AppDbContext>();
                var logger = scopedServices.GetRequiredService<ILogger<CustomWebApplicationFactory<TStartup>>>();

                // Ensure the database is created
                db.Database.EnsureCreated();

                try
                {
                    // Seed the database with test data if needed
                    SeedDatabase(db);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "An error occurred seeding the database with test data. Error: {Message}", ex.Message);
                }
            }
        });
    }

    private void SeedDatabase(AppDbContext context)
    {
        // Add any seed data for integration tests here if needed
    }

    public new void Dispose()
    {
        _connection?.Dispose();
        base.Dispose();
    }
}