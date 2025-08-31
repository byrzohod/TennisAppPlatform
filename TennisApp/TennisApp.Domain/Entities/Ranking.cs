using TennisApp.Domain.Enums;

namespace TennisApp.Domain.Entities;

public class Ranking
{
    public int Id { get; set; }
    public int PlayerId { get; set; }
    public int Position { get; set; }
    public int Points { get; set; }
    public int PreviousPosition { get; set; }
    public DateTime WeekDate { get; set; }
    public RankingCategory Category { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Navigation properties
    public Player Player { get; set; } = null!;
}