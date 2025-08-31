using TennisApp.Domain.Common;
using TennisApp.Domain.Enums;

namespace TennisApp.Domain.Entities;

public class Tournament : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public TournamentType Type { get; set; }
    public Surface Surface { get; set; }
    public int DrawSize { get; set; }
    public decimal PrizeMoney { get; set; }
    public int RankingPoints { get; set; }
    public string? Description { get; set; }
    public string? LogoUrl { get; set; }
    public TournamentStatus Status { get; set; }
    
    // Navigation properties
    public ICollection<Match> Matches { get; set; } = new List<Match>();
    public ICollection<TournamentPlayer> TournamentPlayers { get; set; } = new List<TournamentPlayer>();
}