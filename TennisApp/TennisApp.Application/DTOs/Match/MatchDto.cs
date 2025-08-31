using TennisApp.Application.DTOs.Player;
using TennisApp.Application.DTOs.Tournament;
using TennisApp.Domain.Enums;

namespace TennisApp.Application.DTOs.Match;

public class MatchDto
{
    public int Id { get; set; }
    public int TournamentId { get; set; }
    public TournamentDto? Tournament { get; set; }
    public int Player1Id { get; set; }
    public PlayerDto? Player1 { get; set; }
    public int Player2Id { get; set; }
    public PlayerDto? Player2 { get; set; }
    public int? WinnerId { get; set; }
    public PlayerDto? Winner { get; set; }
    public string Round { get; set; } = string.Empty;
    public DateTime? ScheduledTime { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string? Court { get; set; }
    public MatchStatus Status { get; set; }
    public string? ScoreDisplay { get; set; }
    public int Duration { get; set; }
}

public class CreateMatchDto
{
    public int TournamentId { get; set; }
    public int Player1Id { get; set; }
    public int Player2Id { get; set; }
    public string Round { get; set; } = string.Empty;
    public DateTime? ScheduledTime { get; set; }
    public string? Court { get; set; }
}

public class UpdateMatchDto
{
    public int? WinnerId { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public MatchStatus Status { get; set; }
    public string? ScoreDisplay { get; set; }
    public int Duration { get; set; }
}

public class MatchScoreDto
{
    public List<SetScoreDto> Sets { get; set; } = new List<SetScoreDto>();
    public bool IsRetired { get; set; }
    public bool IsWalkover { get; set; }
    public int? WinnerId { get; set; }
}

public class SetScoreDto
{
    public int Player1Games { get; set; }
    public int Player2Games { get; set; }
    public int? TiebreakScore1 { get; set; }
    public int? TiebreakScore2 { get; set; }
}