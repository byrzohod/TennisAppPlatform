namespace TennisApp.Domain.Entities;

public class TournamentPlayer
{
    public int Id { get; set; }
    public int TournamentId { get; set; }
    public int PlayerId { get; set; }
    public int Seed { get; set; }
    public bool IsWildcard { get; set; }
    public bool IsQualifier { get; set; }
    public DateTime RegisteredAt { get; set; }
    
    // Navigation properties
    public Tournament Tournament { get; set; } = null!;
    public Player Player { get; set; } = null!;
}