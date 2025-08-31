using TennisApp.Application.DTOs.Match;

namespace TennisApp.Application.Services.Match;

public interface IMatchService
{
    Task<IEnumerable<MatchDto>> GetAllMatchesAsync();
    Task<IEnumerable<MatchDto>> GetMatchesByTournamentAsync(int tournamentId);
    Task<IEnumerable<MatchDto>> GetMatchesByPlayerAsync(int playerId);
    Task<MatchDto?> GetMatchByIdAsync(int id);
    Task<MatchDto> CreateMatchAsync(CreateMatchDto createMatchDto);
    Task UpdateMatchAsync(int id, UpdateMatchDto updateMatchDto);
    Task DeleteMatchAsync(int id);
    Task UpdateMatchScoreAsync(int id, MatchScoreDto scoreDto);
}