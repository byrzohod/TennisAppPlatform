# Tennis Tournament Management System

[![CI/CD Pipeline](https://github.com/yourusername/TennisApp/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/TennisApp/actions/workflows/ci.yml)
[![.NET](https://img.shields.io/badge/.NET-9.0-512BD4)](https://dotnet.microsoft.com/)
[![Angular](https://img.shields.io/badge/Angular-17-DD0031)](https://angular.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive tennis tournament management platform built with ASP.NET Core and Angular, designed to handle tournaments, player rankings, match scheduling, and more.

## 🎾 Features

### Current Features (Phase 1 - Foundation)
- ✅ **Clean Architecture** - Domain-driven design with clear separation of concerns
- ✅ **JWT Authentication** - Secure user authentication and authorization
- ✅ **RESTful API** - Fully documented with Swagger/OpenAPI
- ✅ **Database Design** - Entity Framework Core with Code-First migrations
- ✅ **Comprehensive Testing** - Unit and integration tests with high coverage
- ✅ **Structured Logging** - Serilog integration for detailed application insights
- ✅ **Global Error Handling** - Centralized exception handling middleware
- ✅ **API Versioning** - Support for multiple API versions

### Planned Features
- 🚧 Tournament bracket generation and management
- 🚧 Real-time match scoring and statistics
- 🚧 Player ranking system with ELO ratings
- 🚧 Blog platform for tennis news and events
- 🚧 Mobile application support
- 🚧 Live streaming integration

## 🚀 Getting Started

### Prerequisites
- [.NET 9.0 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js 20.x](https://nodejs.org/)
- [SQL Server](https://www.microsoft.com/sql-server) or [SQLite](https://www.sqlite.org/) for development
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/TennisApp.git
   cd TennisApp
   ```

2. **Setup Backend**
   ```bash
   # Restore dependencies
   dotnet restore
   
   # Apply database migrations
   dotnet ef database update -p TennisApp.Infrastructure -s TennisApp.API
   
   # Run the API
   cd TennisApp.API
   dotnet run
   ```
   The API will be available at `http://localhost:5221` with Swagger UI at the root.

3. **Setup Frontend**
   ```bash
   cd TennisApp.Client
   
   # Install dependencies
   npm install
   
   # Run the development server
   npm start
   ```
   The Angular app will be available at `http://localhost:4200`.

## 🏗️ Architecture

The project follows Clean Architecture principles with the following structure:

```
TennisApp/
├── TennisApp.Domain/          # Core business entities and interfaces
├── TennisApp.Application/     # Business logic and use cases
├── TennisApp.Infrastructure/  # Data access and external services
├── TennisApp.API/             # REST API endpoints
├── TennisApp.Client/          # Angular frontend application
└── TennisApp.Tests/           # Unit and integration tests
```

### Technology Stack

**Backend:**
- ASP.NET Core 9.0
- Entity Framework Core 9.0
- SQL Server / SQLite
- JWT Authentication
- AutoMapper
- FluentValidation
- Serilog
- Swagger/OpenAPI

**Frontend:**
- Angular 17
- TypeScript
- RxJS
- Angular Material
- Tailwind CSS

**Testing:**
- xUnit
- Moq
- FluentAssertions
- Integration Testing with WebApplicationFactory

## 🧪 Testing

Run all tests:
```bash
dotnet test
```

Run with coverage:
```bash
dotnet test /p:CollectCoverage=true /p:CoverletOutputFormat=cobertura
```

## 📝 API Documentation

The API documentation is available through Swagger UI when running the application in development mode. Navigate to `http://localhost:5221` to explore the available endpoints.

### Authentication

The API uses JWT Bearer tokens for authentication. To access protected endpoints:

1. Register a new user via `/api/v1/auth/register`
2. Login via `/api/v1/auth/login` to receive a JWT token
3. Include the token in the `Authorization` header: `Bearer <token>`

## 🚢 Deployment

### Docker

Build and run with Docker:
```bash
# Build images
docker-compose build

# Run containers
docker-compose up
```

### Production Configuration

For production deployment, ensure you:
1. Update connection strings in `appsettings.Production.json`
2. Set secure JWT secret keys
3. Configure CORS policies appropriately
4. Enable HTTPS redirection
5. Set up proper logging sinks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Workflow

- All new features should be developed in feature branches
- Pull requests must pass all CI checks
- Code must include appropriate tests
- Follow the existing code style and conventions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Contact

For questions or support, please contact: support@tennisapp.com

## 🙏 Acknowledgments

- Built with Clean Architecture principles
- Inspired by professional tennis tournament management systems
- Community contributions and feedback