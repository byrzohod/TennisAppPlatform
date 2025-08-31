using TennisApp.Application.DTOs.Player;

namespace TennisApp.Application.Services.Player;

public interface IPlayerService
{
    Task<PlayerDto?> GetByIdAsync(int id);
    Task<IEnumerable<PlayerDto>> GetAllAsync();
    Task<PlayerDto> CreateAsync(CreatePlayerDto dto);
    Task<PlayerDto> UpdateAsync(int id, UpdatePlayerDto dto);
    Task<bool> DeleteAsync(int id);
    Task<IEnumerable<PlayerDto>> GetTopPlayersAsync(int count);
}