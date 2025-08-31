using TennisApp.Domain.Common;
using TennisApp.Domain.Enums;
using TennisApp.Domain.ValueObjects;

namespace TennisApp.Domain.Entities;

public class Match : BaseEntity
{
    public int TournamentId { get; set; }
    public int Player1Id { get; set; }
    public int Player2Id { get; set; }
    public int? WinnerId { get; set; }
    public string Round { get; set; } = string.Empty;
    public DateTime? ScheduledTime { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string? Court { get; set; }
    public MatchStatus Status { get; set; }
    public Score? Score { get; set; }
    public int Duration { get; set; } // in minutes
    
    // Navigation properties
    public Tournament Tournament { get; set; } = null!;
    public Player Player1 { get; set; } = null!;
    public Player Player2 { get; set; } = null!;
    public Player? Winner { get; set; }
}