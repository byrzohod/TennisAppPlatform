using AutoMapper;
using Microsoft.Extensions.Logging;
using TennisApp.Application.DTOs.Player;
using TennisApp.Infrastructure.Repositories.Base;

namespace TennisApp.Application.Services.Player;

public class PlayerService : IPlayerService
{
    private readonly IRepository<Domain.Entities.Player> _playerRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<PlayerService> _logger;

    public PlayerService(IRepository<Domain.Entities.Player> playerRepository, IMapper mapper, ILogger<PlayerService> logger)
    {
        _playerRepository = playerRepository;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<PlayerDto?> GetByIdAsync(int id)
    {
        _logger.LogInformation("Fetching player with ID: {PlayerId}", id);
        var player = await _playerRepository.GetByIdAsync(id);
        
        if (player == null)
        {
            _logger.LogWarning("Player not found with ID: {PlayerId}", id);
            return null;
        }
        
        _logger.LogDebug("Successfully retrieved player: {PlayerName}", $"{player.FirstName} {player.LastName}");
        return _mapper.Map<PlayerDto>(player);
    }

    public async Task<IEnumerable<PlayerDto>> GetAllAsync()
    {
        var players = await _playerRepository.GetAllAsync();
        return _mapper.Map<IEnumerable<PlayerDto>>(players);
    }

    public async Task<PlayerDto> CreateAsync(CreatePlayerDto dto)
    {
        _logger.LogInformation("Creating new player: {FirstName} {LastName}", dto.FirstName, dto.LastName);
        
        var player = _mapper.Map<Domain.Entities.Player>(dto);
        player.CreatedAt = DateTime.UtcNow;
        player.UpdatedAt = DateTime.UtcNow;
        
        var created = await _playerRepository.AddAsync(player);
        _logger.LogInformation("Successfully created player with ID: {PlayerId}", created.Id);
        
        return _mapper.Map<PlayerDto>(created);
    }

    public async Task<PlayerDto> UpdateAsync(int id, UpdatePlayerDto dto)
    {
        var player = await _playerRepository.GetByIdAsync(id);
        if (player == null)
            throw new ArgumentException($"Player with id {id} not found");
        
        _mapper.Map(dto, player);
        player.UpdatedAt = DateTime.UtcNow;
        
        await _playerRepository.UpdateAsync(player);
        return _mapper.Map<PlayerDto>(player);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        _logger.LogInformation("Attempting to delete player with ID: {PlayerId}", id);
        
        var player = await _playerRepository.GetByIdAsync(id);
        if (player == null)
        {
            _logger.LogWarning("Cannot delete - Player not found with ID: {PlayerId}", id);
            return false;
        }
        
        await _playerRepository.DeleteAsync(player);
        _logger.LogInformation("Successfully deleted player with ID: {PlayerId}", id);
        return true;
    }

    public async Task<IEnumerable<PlayerDto>> GetTopPlayersAsync(int count)
    {
        var players = await _playerRepository.GetAllAsync();
        var topPlayers = players.OrderBy(p => p.CurrentRanking).Take(count);
        return _mapper.Map<IEnumerable<PlayerDto>>(topPlayers);
    }
}