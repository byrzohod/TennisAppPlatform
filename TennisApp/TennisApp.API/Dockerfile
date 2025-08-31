# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files
COPY ["TennisApp.API/TennisApp.API.csproj", "TennisApp.API/"]
COPY ["TennisApp.Application/TennisApp.Application.csproj", "TennisApp.Application/"]
COPY ["TennisApp.Domain/TennisApp.Domain.csproj", "TennisApp.Domain/"]
COPY ["TennisApp.Infrastructure/TennisApp.Infrastructure.csproj", "TennisApp.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "TennisApp.API/TennisApp.API.csproj"

# Copy source code
COPY . .

# Build application
WORKDIR "/src/TennisApp.API"
RUN dotnet build "TennisApp.API.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "TennisApp.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy published files
COPY --from=publish /app/publish .

# Set ownership
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Start application
ENTRYPOINT ["dotnet", "TennisApp.API.dll"]