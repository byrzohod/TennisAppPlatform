using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;
using TennisApp.Infrastructure.Data;
using Xunit;

namespace TennisApp.Tests.Integration;

public class SharedDatabaseFixture : IAsyncLifetime
{
    private PostgreSqlContainer _postgresContainer = null!;
    public string ConnectionString { get; private set; } = string.Empty;
    
    public async Task InitializeAsync()
    {
        _postgresContainer = new PostgreSqlBuilder()
            .WithImage("postgres:15-alpine")
            .WithDatabase("testdb")
            .WithUsername("testuser")
            .WithPassword("testpass")
            .Build();
            
        await _postgresContainer.StartAsync();
        ConnectionString = _postgresContainer.GetConnectionString();
        
        // Initialize the database schema once
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(ConnectionString)
            .Options;
            
        using var context = new AppDbContext(options);
        // Use EnsureDeleted first to clean any existing schema, then EnsureCreated
        await context.Database.EnsureDeletedAsync();
        await context.Database.EnsureCreatedAsync();
    }
    
    public async Task DisposeAsync()
    {
        await _postgresContainer.DisposeAsync();
    }
    
    public AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(ConnectionString)
            .Options;
            
        return new AppDbContext(options);
    }
    
    public IServiceProvider CreateServiceProvider()
    {
        var services = new ServiceCollection();
        
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(ConnectionString));
        
        return services.BuildServiceProvider();
    }
}

[CollectionDefinition("Database Collection")]
public class DatabaseCollection : ICollectionFixture<SharedDatabaseFixture>
{
    // This class has no code, and is never created. Its purpose is simply
    // to be the place to apply [CollectionDefinition] and all the
    // ICollectionFixture<> interfaces.
}