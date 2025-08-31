using AutoMapper;
using Microsoft.Extensions.Logging;
using TennisApp.Application.DTOs.Tournament;
using TennisApp.Domain.Enums;
using TennisApp.Infrastructure.Repositories.Base;

namespace TennisApp.Application.Services.Tournament;

public class TournamentRegistrationService : ITournamentRegistrationService
{
    private readonly IRepository<Domain.Entities.TournamentPlayer> _registrationRepository;
    private readonly IRepository<Domain.Entities.Tournament> _tournamentRepository;
    private readonly IRepository<Domain.Entities.Player> _playerRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<TournamentRegistrationService> _logger;

    public TournamentRegistrationService(
        IRepository<Domain.Entities.TournamentPlayer> registrationRepository,
        IRepository<Domain.Entities.Tournament> tournamentRepository,
        IRepository<Domain.Entities.Player> playerRepository,
        IMapper mapper,
        ILogger<TournamentRegistrationService> logger)
    {
        _registrationRepository = registrationRepository;
        _tournamentRepository = tournamentRepository;
        _playerRepository = playerRepository;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<IEnumerable<TournamentRegistrationDto>> GetTournamentRegistrationsAsync(int tournamentId)
    {
        _logger.LogInformation("Getting registrations for tournament {TournamentId}", tournamentId);
        
        var registrations = await _registrationRepository.FindAsync(
            r => r.TournamentId == tournamentId && !r.IsDeleted);
        
        return _mapper.Map<IEnumerable<TournamentRegistrationDto>>(registrations);
    }

    public async Task<IEnumerable<TournamentRegistrationDto>> GetPlayerRegistrationsAsync(int playerId)
    {
        _logger.LogInformation("Getting registrations for player {PlayerId}", playerId);
        
        var registrations = await _registrationRepository.FindAsync(
            r => r.PlayerId == playerId && !r.IsDeleted);
        
        return _mapper.Map<IEnumerable<TournamentRegistrationDto>>(registrations);
    }

    public async Task<TournamentRegistrationDto?> GetRegistrationAsync(int tournamentId, int playerId)
    {
        _logger.LogInformation("Getting registration for tournament {TournamentId} and player {PlayerId}", 
            tournamentId, playerId);
        
        var registrations = await _registrationRepository.FindAsync(
            r => r.TournamentId == tournamentId && r.PlayerId == playerId && !r.IsDeleted);
        
        var registration = registrations.FirstOrDefault();
        
        if (registration == null)
        {
            _logger.LogWarning("Registration not found for tournament {TournamentId} and player {PlayerId}", 
                tournamentId, playerId);
            return null;
        }
        
        return _mapper.Map<TournamentRegistrationDto>(registration);
    }

    public async Task<TournamentRegistrationDto> RegisterPlayerAsync(int tournamentId, RegisterPlayerDto dto)
    {
        _logger.LogInformation("Registering player {PlayerId} for tournament {TournamentId}", 
            dto.PlayerId, tournamentId);
        
        // Validate tournament exists and is accepting registrations
        var tournament = await _tournamentRepository.GetByIdAsync(tournamentId);
        if (tournament == null || tournament.IsDeleted)
        {
            throw new ArgumentException($"Tournament {tournamentId} not found");
        }
        
        if (tournament.Status != TournamentStatus.Upcoming)
        {
            throw new InvalidOperationException($"Tournament is not accepting registrations. Status: {tournament.Status}");
        }
        
        // Validate player exists
        var player = await _playerRepository.GetByIdAsync(dto.PlayerId);
        if (player == null || player.IsDeleted)
        {
            throw new ArgumentException($"Player {dto.PlayerId} not found");
        }
        
        // Check if already registered
        var existingRegistration = await _registrationRepository.FindAsync(
            r => r.TournamentId == tournamentId && r.PlayerId == dto.PlayerId && !r.IsDeleted);
        
        if (existingRegistration.Any())
        {
            throw new InvalidOperationException($"Player {dto.PlayerId} is already registered for tournament {tournamentId}");
        }
        
        // Check if tournament is full
        var currentCount = await GetRegistrationCountAsync(tournamentId);
        if (currentCount >= tournament.DrawSize)
        {
            throw new InvalidOperationException($"Tournament {tournamentId} is full. Maximum players: {tournament.DrawSize}");
        }
        
        var registration = new Domain.Entities.TournamentPlayer
        {
            TournamentId = tournamentId,
            PlayerId = dto.PlayerId,
            IsWildcard = dto.IsWildcard,
            IsQualifier = dto.IsQualifier,
            RegisteredAt = DateTime.UtcNow,
            Status = RegistrationStatus.Pending,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow
        };
        
        await _registrationRepository.AddAsync(registration);
        
        _logger.LogInformation("Player {PlayerId} registered for tournament {TournamentId}", 
            dto.PlayerId, tournamentId);
        
        return _mapper.Map<TournamentRegistrationDto>(registration);
    }

    public async Task<IEnumerable<TournamentRegistrationDto>> BulkRegisterPlayersAsync(
        int tournamentId, BulkRegistrationDto dto)
    {
        _logger.LogInformation("Bulk registering {Count} players for tournament {TournamentId}", 
            dto.PlayerIds.Count, tournamentId);
        
        var registrations = new List<TournamentRegistrationDto>();
        
        foreach (var playerId in dto.PlayerIds)
        {
            try
            {
                var registerDto = new RegisterPlayerDto
                {
                    PlayerId = playerId,
                    IsWildcard = dto.IsWildcard,
                    IsQualifier = dto.IsQualifier
                };
                
                var registration = await RegisterPlayerAsync(tournamentId, registerDto);
                registrations.Add(registration);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Failed to register player {PlayerId}: {Message}", playerId, ex.Message);
            }
        }
        
        return registrations;
    }

    public async Task UpdateRegistrationAsync(int tournamentId, int playerId, UpdateRegistrationDto dto)
    {
        _logger.LogInformation("Updating registration for tournament {TournamentId} and player {PlayerId}", 
            tournamentId, playerId);
        
        var registrations = await _registrationRepository.FindAsync(
            r => r.TournamentId == tournamentId && r.PlayerId == playerId && !r.IsDeleted);
        
        var registration = registrations.FirstOrDefault();
        
        if (registration == null)
        {
            throw new ArgumentException($"Registration not found for tournament {tournamentId} and player {playerId}");
        }
        
        registration.Seed = dto.Seed;
        registration.Status = dto.Status;
        registration.Notes = dto.Notes;
        registration.UpdatedAt = DateTime.UtcNow;
        
        await _registrationRepository.UpdateAsync(registration);
        
        _logger.LogInformation("Updated registration for tournament {TournamentId} and player {PlayerId}", 
            tournamentId, playerId);
    }

    public async Task CheckInPlayerAsync(int tournamentId, int playerId)
    {
        _logger.LogInformation("Checking in player {PlayerId} for tournament {TournamentId}", 
            playerId, tournamentId);
        
        var registrations = await _registrationRepository.FindAsync(
            r => r.TournamentId == tournamentId && r.PlayerId == playerId && !r.IsDeleted);
        
        var registration = registrations.FirstOrDefault();
        
        if (registration == null)
        {
            throw new ArgumentException($"Registration not found for tournament {tournamentId} and player {playerId}");
        }
        
        if (registration.Status != RegistrationStatus.Approved)
        {
            throw new InvalidOperationException($"Player must be approved before check-in. Current status: {registration.Status}");
        }
        
        registration.CheckedInAt = DateTime.UtcNow;
        registration.Status = RegistrationStatus.CheckedIn;
        registration.UpdatedAt = DateTime.UtcNow;
        
        await _registrationRepository.UpdateAsync(registration);
        
        _logger.LogInformation("Player {PlayerId} checked in for tournament {TournamentId}", 
            playerId, tournamentId);
    }

    public async Task WithdrawPlayerAsync(int tournamentId, int playerId)
    {
        _logger.LogInformation("Withdrawing player {PlayerId} from tournament {TournamentId}", 
            playerId, tournamentId);
        
        var registrations = await _registrationRepository.FindAsync(
            r => r.TournamentId == tournamentId && r.PlayerId == playerId && !r.IsDeleted);
        
        var registration = registrations.FirstOrDefault();
        
        if (registration == null)
        {
            throw new ArgumentException($"Registration not found for tournament {tournamentId} and player {playerId}");
        }
        
        registration.Status = RegistrationStatus.Withdrawn;
        registration.UpdatedAt = DateTime.UtcNow;
        
        await _registrationRepository.UpdateAsync(registration);
        
        _logger.LogInformation("Player {PlayerId} withdrawn from tournament {TournamentId}", 
            playerId, tournamentId);
    }

    public async Task<bool> IsPlayerRegisteredAsync(int tournamentId, int playerId)
    {
        var registrations = await _registrationRepository.FindAsync(
            r => r.TournamentId == tournamentId && r.PlayerId == playerId && 
            !r.IsDeleted && r.Status != RegistrationStatus.Withdrawn);
        
        return registrations.Any();
    }

    public async Task<int> GetRegistrationCountAsync(int tournamentId)
    {
        return await _registrationRepository.CountAsync(
            r => r.TournamentId == tournamentId && !r.IsDeleted && 
            r.Status != RegistrationStatus.Withdrawn && r.Status != RegistrationStatus.Rejected);
    }

    public async Task AssignSeedsAsync(int tournamentId)
    {
        _logger.LogInformation("Assigning seeds for tournament {TournamentId}", tournamentId);
        
        var registrations = await _registrationRepository.FindAsync(
            r => r.TournamentId == tournamentId && !r.IsDeleted && 
            r.Status == RegistrationStatus.Approved);
        
        var registrationList = registrations.ToList();
        
        // Get player rankings for seeding
        var playerIds = registrationList.Select(r => r.PlayerId).ToList();
        var players = await _playerRepository.FindAsync(p => playerIds.Contains(p.Id));
        var playerDict = players.ToDictionary(p => p.Id, p => p);
        
        // Sort by ranking points (descending) and assign seeds
        var sortedRegistrations = registrationList
            .Where(r => playerDict.ContainsKey(r.PlayerId))
            .OrderByDescending(r => playerDict[r.PlayerId].RankingPoints)
            .ToList();
        
        for (int i = 0; i < sortedRegistrations.Count; i++)
        {
            var registration = sortedRegistrations[i];
            registration.Seed = i + 1;
            registration.UpdatedAt = DateTime.UtcNow;
            await _registrationRepository.UpdateAsync(registration);
        }
        
        _logger.LogInformation("Assigned seeds for {Count} players in tournament {TournamentId}", 
            sortedRegistrations.Count, tournamentId);
    }
}