using TennisApp.Application.DTOs.Player;
using TennisApp.Domain.Enums;

namespace TennisApp.Application.DTOs.Tournament;

public class TournamentRegistrationDto
{
    public int Id { get; set; }
    public int TournamentId { get; set; }
    public string TournamentName { get; set; } = string.Empty;
    public int PlayerId { get; set; }
    public string PlayerName { get; set; } = string.Empty;
    public PlayerDto? Player { get; set; }
    public int? Seed { get; set; }
    public bool IsWildcard { get; set; }
    public bool IsQualifier { get; set; }
    public DateTime RegisteredAt { get; set; }
    public DateTime? CheckedInAt { get; set; }
    public RegistrationStatus Status { get; set; }
    public string StatusDisplay => Status.ToString();
    public string? Notes { get; set; }
}

public class RegisterPlayerDto
{
    public int PlayerId { get; set; }
    public bool IsWildcard { get; set; }
    public bool IsQualifier { get; set; }
    public string? Notes { get; set; }
}

public class UpdateRegistrationDto
{
    public int? Seed { get; set; }
    public RegistrationStatus Status { get; set; }
    public string? Notes { get; set; }
}

public class BulkRegistrationDto
{
    public List<int> PlayerIds { get; set; } = new List<int>();
    public bool IsWildcard { get; set; }
    public bool IsQualifier { get; set; }
}

public class CheckInPlayerDto
{
    public int PlayerId { get; set; }
}