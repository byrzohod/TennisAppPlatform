using TennisApp.Application.DTOs.Tournament;

namespace TennisApp.Application.Services.Tournament;

public interface ITournamentService
{
    Task<TournamentDto?> GetByIdAsync(int id);
    Task<IEnumerable<TournamentDto>> GetAllAsync();
    Task<TournamentDto> CreateAsync(CreateTournamentDto dto);
    Task<TournamentDto> UpdateAsync(int id, UpdateTournamentDto dto);
    Task<bool> DeleteAsync(int id);
    Task<IEnumerable<TournamentDto>> GetUpcomingTournamentsAsync();
    Task<IEnumerable<TournamentDto>> GetActiveTournamentsAsync();
}