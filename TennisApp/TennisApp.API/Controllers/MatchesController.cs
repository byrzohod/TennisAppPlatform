using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TennisApp.Application.DTOs.Match;
using TennisApp.Application.Services.Match;

namespace TennisApp.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class MatchesController : ControllerBase
{
    private readonly IMatchService _matchService;
    private readonly ILogger<MatchesController> _logger;

    public MatchesController(IMatchService matchService, ILogger<MatchesController> logger)
    {
        _matchService = matchService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MatchDto>>> GetAllMatches()
    {
        _logger.LogInformation("Getting all matches");
        var matches = await _matchService.GetAllMatchesAsync();
        return Ok(matches);
    }

    [HttpGet("tournament/{tournamentId}")]
    public async Task<ActionResult<IEnumerable<MatchDto>>> GetMatchesByTournament(int tournamentId)
    {
        _logger.LogInformation("Getting matches for tournament {TournamentId}", tournamentId);
        var matches = await _matchService.GetMatchesByTournamentAsync(tournamentId);
        return Ok(matches);
    }

    [HttpGet("player/{playerId}")]
    public async Task<ActionResult<IEnumerable<MatchDto>>> GetMatchesByPlayer(int playerId)
    {
        _logger.LogInformation("Getting matches for player {PlayerId}", playerId);
        var matches = await _matchService.GetMatchesByPlayerAsync(playerId);
        return Ok(matches);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MatchDto>> GetMatch(int id)
    {
        _logger.LogInformation("Getting match {MatchId}", id);
        var match = await _matchService.GetMatchByIdAsync(id);
        
        if (match == null)
        {
            _logger.LogWarning("Match {MatchId} not found", id);
            return NotFound();
        }

        return Ok(match);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<MatchDto>> CreateMatch(CreateMatchDto createMatchDto)
    {
        _logger.LogInformation("Creating new match");
        
        try
        {
            var match = await _matchService.CreateMatchAsync(createMatchDto);
            return CreatedAtAction(nameof(GetMatch), new { id = match.Id }, match);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to create match: {Message}", ex.Message);
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateMatch(int id, UpdateMatchDto updateMatchDto)
    {
        _logger.LogInformation("Updating match {MatchId}", id);
        
        try
        {
            await _matchService.UpdateMatchAsync(id, updateMatchDto);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to update match {MatchId}: {Message}", id, ex.Message);
            return NotFound(ex.Message);
        }
    }

    [HttpPut("{id}/score")]
    [Authorize]
    public async Task<IActionResult> UpdateMatchScore(int id, MatchScoreDto scoreDto)
    {
        _logger.LogInformation("Updating score for match {MatchId}", id);
        
        try
        {
            await _matchService.UpdateMatchScoreAsync(id, scoreDto);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to update score for match {MatchId}: {Message}", id, ex.Message);
            return NotFound(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteMatch(int id)
    {
        _logger.LogInformation("Deleting match {MatchId}", id);
        
        try
        {
            await _matchService.DeleteMatchAsync(id);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Failed to delete match {MatchId}: {Message}", id, ex.Message);
            return NotFound(ex.Message);
        }
    }
}