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

    public TournamentsController(ITournamentService tournamentService)
    {
        _tournamentService = tournamentService;
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
}