namespace TennisApp.Domain.ValueObjects;

public class Score
{
    public List<SetScore> Sets { get; set; } = new List<SetScore>();
    public bool IsRetired { get; set; }
    public bool IsWalkover { get; set; }
    
    public string GetScoreDisplay()
    {
        if (IsWalkover) return "W/O";
        if (IsRetired) return string.Join(" ", Sets.Select(s => s.ToString())) + " RET";
        return string.Join(" ", Sets.Select(s => s.ToString()));
    }
}

public class SetScore
{
    public int Player1Games { get; set; }
    public int Player2Games { get; set; }
    public int? TiebreakScore1 { get; set; }
    public int? TiebreakScore2 { get; set; }
    
    public override string ToString()
    {
        var score = $"{Player1Games}-{Player2Games}";
        if (TiebreakScore1.HasValue && TiebreakScore2.HasValue)
        {
            var tiebreakLoser = Math.Min(TiebreakScore1.Value, TiebreakScore2.Value);
            score += $"({tiebreakLoser})";
        }
        return score;
    }
}