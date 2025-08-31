using TennisApp.Application.DTOs.Bracket;

namespace TennisApp.Application.Services.Bracket;

public interface IBracketService
{
    Task<BracketDto> GenerateBracketAsync(GenerateBracketDto generateDto);
    Task<BracketDto?> GetBracketAsync(int tournamentId, string bracketType = "Main");
    Task<BracketDto?> GetBracketByIdAsync(int bracketId);
    Task<BracketVisualizationDto?> GetBracketVisualizationAsync(int tournamentId, string bracketType = "Main");
    Task<BracketNodeDto?> UpdateBracketNodeAsync(int nodeId, UpdateBracketNodeDto updateDto);
    Task<bool> DeleteBracketAsync(int bracketId);
    Task<bool> RegenerateBracketAsync(int bracketId);
    Task<List<int>> GetBracketSeedingOrderAsync(int drawSize);
}