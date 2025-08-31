namespace TennisApp.Domain.ValueObjects;

public class RankingPoints
{
    public int TotalPoints { get; set; }
    public List<TournamentPoints> TournamentPointsList { get; set; } = new List<TournamentPoints>();
    
    public void RecalculateTotal()
    {
        TotalPoints = TournamentPointsList.Sum(tp => tp.Points);
    }
}

public class TournamentPoints
{
    public int TournamentId { get; set; }
    public string TournamentName { get; set; } = string.Empty;
    public int Points { get; set; }
    public DateTime EarnedDate { get; set; }
    public DateTime ExpiryDate { get; set; }
}