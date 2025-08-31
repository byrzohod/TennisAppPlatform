using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TennisApp.Application.DTOs.Bracket;
using TennisApp.Application.Services.Bracket;

namespace TennisApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BracketsController : ControllerBase
{
    private readonly IBracketService _bracketService;
    private readonly ILogger<BracketsController> _logger;

    public BracketsController(IBracketService bracketService, ILogger<BracketsController> logger)
    {
        _bracketService = bracketService;
        _logger = logger;
    }

    [HttpPost("generate")]
    [Authorize(Roles = "Admin,Organizer")]
    public async Task<ActionResult<BracketDto>> GenerateBracket([FromBody] GenerateBracketDto generateDto)
    {
        try
        {
            var bracket = await _bracketService.GenerateBracketAsync(generateDto);
            return Ok(bracket);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument for bracket generation");
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation for bracket generation");
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating bracket");
            return StatusCode(500, new { message = "An error occurred while generating the bracket" });
        }
    }

    [HttpGet("tournament/{tournamentId}")]
    [AllowAnonymous]
    public async Task<ActionResult<BracketDto>> GetBracket(int tournamentId, [FromQuery] string bracketType = "Main")
    {
        var bracket = await _bracketService.GetBracketAsync(tournamentId, bracketType);
        if (bracket == null)
        {
            return NotFound(new { message = "Bracket not found" });
        }
        return Ok(bracket);
    }

    [HttpGet("{bracketId}")]
    [AllowAnonymous]
    public async Task<ActionResult<BracketDto>> GetBracketById(int bracketId)
    {
        var bracket = await _bracketService.GetBracketByIdAsync(bracketId);
        if (bracket == null)
        {
            return NotFound(new { message = "Bracket not found" });
        }
        return Ok(bracket);
    }

    [HttpGet("tournament/{tournamentId}/visualization")]
    [AllowAnonymous]
    public async Task<ActionResult<BracketVisualizationDto>> GetBracketVisualization(
        int tournamentId, 
        [FromQuery] string bracketType = "Main")
    {
        var visualization = await _bracketService.GetBracketVisualizationAsync(tournamentId, bracketType);
        if (visualization == null)
        {
            return NotFound(new { message = "Bracket visualization not found" });
        }
        return Ok(visualization);
    }

    [HttpPut("node/{nodeId}")]
    [Authorize(Roles = "Admin,Organizer")]
    public async Task<ActionResult<BracketNodeDto>> UpdateBracketNode(
        int nodeId, 
        [FromBody] UpdateBracketNodeDto updateDto)
    {
        var node = await _bracketService.UpdateBracketNodeAsync(nodeId, updateDto);
        if (node == null)
        {
            return NotFound(new { message = "Bracket node not found" });
        }
        return Ok(node);
    }

    [HttpDelete("{bracketId}")]
    [Authorize(Roles = "Admin,Organizer")]
    public async Task<IActionResult> DeleteBracket(int bracketId)
    {
        var result = await _bracketService.DeleteBracketAsync(bracketId);
        if (!result)
        {
            return NotFound(new { message = "Bracket not found" });
        }
        return NoContent();
    }

    [HttpPost("{bracketId}/regenerate")]
    [Authorize(Roles = "Admin,Organizer")]
    public async Task<IActionResult> RegenerateBracket(int bracketId)
    {
        try
        {
            var result = await _bracketService.RegenerateBracketAsync(bracketId);
            if (!result)
            {
                return NotFound(new { message = "Bracket not found" });
            }
            return Ok(new { message = "Bracket regenerated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error regenerating bracket");
            return StatusCode(500, new { message = "An error occurred while regenerating the bracket" });
        }
    }

    [HttpGet("seeding-order/{drawSize}")]
    [AllowAnonymous]
    public async Task<ActionResult<List<int>>> GetSeedingOrder(int drawSize)
    {
        try
        {
            var order = await _bracketService.GetBracketSeedingOrderAsync(drawSize);
            return Ok(order);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}