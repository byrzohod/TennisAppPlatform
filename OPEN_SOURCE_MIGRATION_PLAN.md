# Open Source Technology Migration Plan

## Current State Analysis

### Proprietary/Closed Source Components to Replace:
1. **SQL Server** → **PostgreSQL** 
2. **Entity Framework Core SQL Server Provider** → **Entity Framework Core PostgreSQL Provider**
3. **Windows-specific hosting** → **Linux-compatible hosting**

### Already Open Source Components (Keep):
- ✅ **ASP.NET Core** (MIT License)
- ✅ **Entity Framework Core** (MIT License) 
- ✅ **Angular** (MIT License)
- ✅ **Serilog** (Apache 2.0)
- ✅ **AutoMapper** (MIT License)
- ✅ **FluentValidation** (Apache 2.0)
- ✅ **xUnit** (Apache 2.0)
- ✅ **Cypress** (MIT License)

## Migration Plan

### Phase 1: Database Migration (Priority: HIGH)
**Target: PostgreSQL 15+**

#### 1.1 Database Provider Update
```csharp
// BEFORE (SQL Server)
services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

// AFTER (PostgreSQL)
services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));
```

#### 1.2 Connection String Changes
```json
// BEFORE
"DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=TennisAppDb;Trusted_Connection=true;MultipleActiveResultSets=true"

// AFTER  
"DefaultConnection": "Host=localhost;Database=tennisappdb;Username=tennisapp;Password=your_password"
```

#### 1.3 Migration Steps
1. **Install PostgreSQL Provider**
   ```bash
   dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
   dotnet remove package Microsoft.EntityFrameworkCore.SqlServer
   ```

2. **Update Program.cs**
   - Replace `UseSqlServer()` with `UseNpgsql()`
   - Update connection string configuration

3. **Database Schema Migration**
   ```bash
   # Remove existing migrations
   dotnet ef migrations remove

   # Create new PostgreSQL migration
   dotnet ef migrations add InitialPostgreSQL
   dotnet ef database update
   ```

4. **Data Type Adjustments**
   - Review Entity configurations for PostgreSQL-specific types
   - Update any SQL Server-specific column types
   - Test all database operations

### Phase 2: Development Environment Setup
#### 2.1 PostgreSQL Development Setup
**Option A: Docker (Recommended)**
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: tennisappdb
      POSTGRES_USER: tennisapp
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Option B: Local Installation**
- Install PostgreSQL 15+ locally
- Create database and user
- Configure connection string

#### 2.2 Updated Development Scripts
```bash
# scripts/setup-dev-db.sh
#!/bin/bash
docker-compose up -d postgres
sleep 5
dotnet ef database update
dotnet run --project TennisApp.API
```

### Phase 3: Production Considerations
#### 3.1 Hosting Options (All Open Source)
- **Self-hosted on Linux** (Ubuntu/CentOS + Nginx)
- **Docker containers** (PostgreSQL + ASP.NET Core)
- **Cloud platforms with PostgreSQL** (AWS RDS, Google Cloud SQL, Azure Database for PostgreSQL)

#### 3.2 Additional Open Source Tools
- **Nginx** - Web server/reverse proxy (replacing IIS)
- **Redis** - Caching layer (if needed)
- **Prometheus + Grafana** - Monitoring (replacing Application Insights)
- **ELK Stack** - Log aggregation (Elasticsearch, Logstash, Kibana)

### Phase 4: CI/CD Pipeline Updates
#### 4.1 GitHub Actions Updates
```yaml
# Update CI to test against PostgreSQL
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: testdb
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

#### 4.2 Docker Configuration
```dockerfile
# Multi-stage build for production
FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine AS runtime
# Alpine Linux - smaller, more secure base image
```

## Implementation Timeline

### Week 1: PostgreSQL Migration
- [ ] Install Npgsql package
- [ ] Update Program.cs and configuration
- [ ] Create new migrations
- [ ] Test all existing functionality
- [ ] Update integration tests

### Week 2: Development Environment
- [ ] Set up Docker Compose for local development
- [ ] Update documentation
- [ ] Create database setup scripts
- [ ] Test E2E with new database

### Week 3: CI/CD Updates  
- [ ] Update GitHub Actions
- [ ] Test pipeline with PostgreSQL
- [ ] Create production Docker images
- [ ] Update deployment scripts

### Week 4: Documentation & Migration Guide
- [ ] Create migration documentation
- [ ] Update README with new setup instructions
- [ ] Create troubleshooting guide
- [ ] Performance testing and optimization

## Benefits of Full Open Source Stack

### Technical Benefits
1. **No licensing costs** - Reduce operational expenses
2. **Better performance** - PostgreSQL often outperforms SQL Server
3. **Linux compatibility** - Better container and cloud deployment
4. **Community support** - Larger open source community
5. **Transparency** - Full visibility into all components

### Development Benefits
1. **Consistent environment** - Same stack in dev, staging, production
2. **Better debugging** - Open source allows deeper investigation
3. **Flexibility** - Not locked into proprietary ecosystems
4. **Modern tooling** - Access to latest open source innovations

### Business Benefits
1. **Cost reduction** - No SQL Server licensing fees
2. **Vendor independence** - Not tied to Microsoft ecosystem
3. **Scalability** - Better horizontal scaling options
4. **Compliance** - Easier to audit open source components

## Risk Mitigation

### Data Migration Risks
- **Backup Strategy**: Full database backup before migration
- **Testing**: Comprehensive testing of all data operations
- **Rollback Plan**: Keep SQL Server option available during transition

### Performance Risks
- **Benchmarking**: Compare PostgreSQL vs SQL Server performance
- **Monitoring**: Set up comprehensive monitoring during migration
- **Optimization**: PostgreSQL-specific query optimization

### Team Knowledge Risks
- **Training**: Ensure team is comfortable with PostgreSQL
- **Documentation**: Create internal PostgreSQL best practices guide
- **Support**: Establish connection with PostgreSQL community/experts

## Success Metrics

1. **Migration Success**: All data migrated without loss
2. **Performance**: Equal or better response times
3. **Stability**: No increase in error rates
4. **Cost**: Measurable reduction in licensing costs
5. **Developer Experience**: Equal or better development workflow

## Next Steps

1. **Immediate**: Fix current API connectivity issue
2. **This Week**: Begin PostgreSQL migration planning
3. **Next Sprint**: Implement PostgreSQL migration
4. **Following Sprint**: Complete open source stack migration

---

**Note**: This migration aligns perfectly with modern development practices and will make the Tennis App more deployable, cost-effective, and maintainable in the long term.