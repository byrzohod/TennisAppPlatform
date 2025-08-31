using TennisApp.Application.DTOs.Tournament;

namespace TennisApp.Application.Services.Tournament;

public interface ITournamentRegistrationService
{
    Task<IEnumerable<TournamentRegistrationDto>> GetTournamentRegistrationsAsync(int tournamentId);
    Task<IEnumerable<TournamentRegistrationDto>> GetPlayerRegistrationsAsync(int playerId);
    Task<TournamentRegistrationDto?> GetRegistrationAsync(int tournamentId, int playerId);
    Task<TournamentRegistrationDto> RegisterPlayerAsync(int tournamentId, RegisterPlayerDto dto);
    Task<IEnumerable<TournamentRegistrationDto>> BulkRegisterPlayersAsync(int tournamentId, BulkRegistrationDto dto);
    Task UpdateRegistrationAsync(int tournamentId, int playerId, UpdateRegistrationDto dto);
    Task CheckInPlayerAsync(int tournamentId, int playerId);
    Task WithdrawPlayerAsync(int tournamentId, int playerId);
    Task<bool> IsPlayerRegisteredAsync(int tournamentId, int playerId);
    Task<int> GetRegistrationCountAsync(int tournamentId);
    Task AssignSeedsAsync(int tournamentId);
}