using TennisApp.Domain.Common;

namespace TennisApp.Domain.Entities;

public class Player : BaseEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string? ProfileImageUrl { get; set; }
    public int CurrentRanking { get; set; }
    public int RankingPoints { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? CoachName { get; set; }
    public string Gender { get; set; } = "M"; // M or F
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    public ICollection<Match> HomeMatches { get; set; } = new List<Match>();
    public ICollection<Match> AwayMatches { get; set; } = new List<Match>();
    public ICollection<TournamentPlayer> TournamentPlayers { get; set; } = new List<TournamentPlayer>();
    public ICollection<Ranking> Rankings { get; set; } = new List<Ranking>();
}