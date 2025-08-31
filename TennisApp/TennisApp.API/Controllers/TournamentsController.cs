using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TennisApp.Application.DTOs.Tournament;
using TennisApp.Application.Services.Tournament;

namespace TennisApp.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class TournamentsController : ControllerBase
{
    private readonly ITournamentService _tournamentService;
    private readonly ITournamentRegistrationService _registrationService;
    private readonly ILogger<TournamentsController> _logger;

    public TournamentsController(
        ITournamentService tournamentService,
        ITournamentRegistrationService registrationService,
        ILogger<TournamentsController> logger)
    {
        _tournamentService = tournamentService;
        _registrationService = registrationService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TournamentDto>>> GetAll()
    {
        var tournaments = await _tournamentService.GetAllAsync();
        return Ok(tournaments);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TournamentDto>> GetById(int id)
    {
        var tournament = await _tournamentService.GetByIdAsync(id);
        if (tournament == null)
            return NotFound();
        return Ok(tournament);
    }

    [HttpGet("upcoming")]
    public async Task<ActionResult<IEnumerable<TournamentDto>>> GetUpcoming()
    {
        var tournaments = await _tournamentService.GetUpcomingTournamentsAsync();
        return Ok(tournaments);
    }

    [HttpGet("active")]
    public async Task<ActionResult<IEnumerable<TournamentDto>>> GetActive()
    {
        var tournaments = await _tournamentService.GetActiveTournamentsAsync();
        return Ok(tournaments);
    }

    [HttpPost]
    public async Task<ActionResult<TournamentDto>> Create(CreateTournamentDto dto)
    {
        var tournament = await _tournamentService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = tournament.Id }, tournament);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, UpdateTournamentDto dto)
    {
        try
        {
            await _tournamentService.UpdateAsync(id, dto);
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
        var result = await _tournamentService.DeleteAsync(id);
        if (!result)
            return NotFound();
        return NoContent();
    }

    // Registration endpoints
    [HttpGet("{id}/registrations")]
    public async Task<ActionResult<IEnumerable<TournamentRegistrationDto>>> GetRegistrations(int id)
    {
        _logger.LogInformation("Getting registrations for tournament {TournamentId}", id);
        var registrations = await _registrationService.GetTournamentRegistrationsAsync(id);
        return Ok(registrations);
    }

    [HttpGet("{tournamentId}/registrations/{playerId}")]
    public async Task<ActionResult<TournamentRegistrationDto>> GetRegistration(int tournamentId, int playerId)
    {
        _logger.LogInformation("Getting registration for tournament {TournamentId} and player {PlayerId}", 
            tournamentId, playerId);
        var registration = await _registrationService.GetRegistrationAsync(tournamentId, playerId);
        
        if (registration == null)
        {
            return NotFound();
        }
        
        return Ok(registration);
    }

    [HttpPost("{id}/registrations")]
    [Authorize]
    public async Task<ActionResult<TournamentRegistrationDto>> RegisterPlayer(int id, RegisterPlayerDto dto)
    {
        _logger.LogInformation("Registering player {PlayerId} for tournament {TournamentId}", dto.PlayerId, id);
        
        try
        {
            var registration = await _registrationService.RegisterPlayerAsync(id, dto);
            return CreatedAtAction(nameof(GetRegistration), 
                new { tournamentId = id, playerId = dto.PlayerId }, registration);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Registration failed: {Message}", ex.Message);
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Registration failed: {Message}", ex.Message);
            return Conflict(ex.Message);
        }
    }

    [HttpPost("{id}/registrations/bulk")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<TournamentRegistrationDto>>> BulkRegisterPlayers(
        int id, BulkRegistrationDto dto)
    {
        _logger.LogInformation("Bulk registering {Count} players for tournament {TournamentId}", 
            dto.PlayerIds.Count, id);
        
        var registrations = await _registrationService.BulkRegisterPlayersAsync(id, dto);
        return Ok(registrations);
    }

    [HttpPut("{tournamentId}/registrations/{playerId}")]
    [Authorize]
    public async Task<IActionResult> UpdateRegistration(
        int tournamentId, int playerId, UpdateRegistrationDto dto)
    {
        _logger.LogInformation("Updating registration for tournament {TournamentId} and player {PlayerId}", 
            tournamentId, playerId);
        
        try
        {
            await _registrationService.UpdateRegistrationAsync(tournamentId, playerId, dto);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Update registration failed: {Message}", ex.Message);
            return NotFound(ex.Message);
        }
    }

    [HttpPost("{tournamentId}/registrations/{playerId}/checkin")]
    [Authorize]
    public async Task<IActionResult> CheckInPlayer(int tournamentId, int playerId)
    {
        _logger.LogInformation("Checking in player {PlayerId} for tournament {TournamentId}", 
            playerId, tournamentId);
        
        try
        {
            await _registrationService.CheckInPlayerAsync(tournamentId, playerId);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Check-in failed: {Message}", ex.Message);
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Check-in failed: {Message}", ex.Message);
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{tournamentId}/registrations/{playerId}/withdraw")]
    [Authorize]
    public async Task<IActionResult> WithdrawPlayer(int tournamentId, int playerId)
    {
        _logger.LogInformation("Withdrawing player {PlayerId} from tournament {TournamentId}", 
            playerId, tournamentId);
        
        try
        {
            await _registrationService.WithdrawPlayerAsync(tournamentId, playerId);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Withdrawal failed: {Message}", ex.Message);
            return NotFound(ex.Message);
        }
    }

    [HttpPost("{id}/registrations/assign-seeds")]
    [Authorize]
    public async Task<IActionResult> AssignSeeds(int id)
    {
        _logger.LogInformation("Assigning seeds for tournament {TournamentId}", id);
        
        await _registrationService.AssignSeedsAsync(id);
        return NoContent();
    }
}