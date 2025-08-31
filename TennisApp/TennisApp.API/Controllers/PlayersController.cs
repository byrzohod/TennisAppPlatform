using Microsoft.AspNetCore.Mvc;
using TennisApp.Application.DTOs.Player;
using TennisApp.Application.Services.Player;

namespace TennisApp.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class PlayersController : ControllerBase
{
    private readonly IPlayerService _playerService;

    public PlayersController(IPlayerService playerService)
    {
        _playerService = playerService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PlayerDto>>> GetAll()
    {
        var players = await _playerService.GetAllAsync();
        return Ok(players);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PlayerDto>> GetById(int id)
    {
        var player = await _playerService.GetByIdAsync(id);
        if (player == null)
            return NotFound();
        return Ok(player);
    }

    [HttpGet("top/{count}")]
    public async Task<ActionResult<IEnumerable<PlayerDto>>> GetTopPlayers(int count)
    {
        var players = await _playerService.GetTopPlayersAsync(count);
        return Ok(players);
    }

    [HttpPost]
    public async Task<ActionResult<PlayerDto>> Create(CreatePlayerDto dto)
    {
        var player = await _playerService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = player.Id }, player);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, UpdatePlayerDto dto)
    {
        try
        {
            await _playerService.UpdateAsync(id, dto);
            return NoContent();
        }
        catch (ArgumentException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var result = await _playerService.DeleteAsync(id);
        if (!result)
            return NotFound();
        return NoContent();
    }
}