using TennisApp.Domain.Common;

namespace TennisApp.Domain.Entities;

public class Bracket : BaseEntity
{
    public int TournamentId { get; set; }
    public string BracketType { get; set; } = string.Empty; // Main, Qualifying, Consolation
    public int DrawSize { get; set; } // 16, 32, 64, 128
    public int TotalRounds { get; set; }
    public DateTime GeneratedAt { get; set; }
    public string? GeneratedBy { get; set; }
    
    // Navigation properties
    public Tournament Tournament { get; set; } = null!;
    public ICollection<BracketNode> Nodes { get; set; } = new List<BracketNode>();
}

public class BracketNode : BaseEntity
{
    public int BracketId { get; set; }
    public int Position { get; set; } // Position in the bracket (1-based)
    public int Round { get; set; } // Round number (1 = first round, etc.)
    public int? PlayerId { get; set; }
    public int? Seed { get; set; }
    public bool IsBye { get; set; }
    public int? MatchId { get; set; }
    public int? WinnerNodePosition { get; set; } // Position this winner advances to
    
    // Navigation properties
    public Bracket Bracket { get; set; } = null!;
    public Player? Player { get; set; }
    public Match? Match { get; set; }
}