namespace TennisApp.Application.DTOs.Bracket;

public class BracketDto
{
    public int Id { get; set; }
    public int TournamentId { get; set; }
    public string BracketType { get; set; } = string.Empty;
    public int DrawSize { get; set; }
    public int TotalRounds { get; set; }
    public DateTime GeneratedAt { get; set; }
    public string? GeneratedBy { get; set; }
    public List<BracketNodeDto> Nodes { get; set; } = new();
}

public class BracketNodeDto
{
    public int Id { get; set; }
    public int Position { get; set; }
    public int Round { get; set; }
    public int? PlayerId { get; set; }
    public string? PlayerName { get; set; }
    public int? Seed { get; set; }
    public bool IsBye { get; set; }
    public int? MatchId { get; set; }
    public int? WinnerNodePosition { get; set; }
}

public class GenerateBracketDto
{
    public int TournamentId { get; set; }
    public string BracketType { get; set; } = "Main";
    public int DrawSize { get; set; }
    public bool AutoSeed { get; set; } = true;
    public List<ManualSeedDto>? ManualSeeds { get; set; }
}

public class ManualSeedDto
{
    public int PlayerId { get; set; }
    public int Seed { get; set; }
}

public class UpdateBracketNodeDto
{
    public int? PlayerId { get; set; }
    public int? Seed { get; set; }
    public bool IsBye { get; set; }
}

public class BracketVisualizationDto
{
    public int TournamentId { get; set; }
    public string TournamentName { get; set; } = string.Empty;
    public string BracketType { get; set; } = string.Empty;
    public int DrawSize { get; set; }
    public List<RoundDto> Rounds { get; set; } = new();
}

public class RoundDto
{
    public int RoundNumber { get; set; }
    public string RoundName { get; set; } = string.Empty; // "Final", "Semi-Final", etc.
    public List<MatchupDto> Matchups { get; set; } = new();
}

public class MatchupDto
{
    public int Position { get; set; }
    public PlayerSlotDto? TopPlayer { get; set; }
    public PlayerSlotDto? BottomPlayer { get; set; }
    public int? MatchId { get; set; }
    public int? WinnerPosition { get; set; }
}

public class PlayerSlotDto
{
    public int? PlayerId { get; set; }
    public string? PlayerName { get; set; }
    public int? Seed { get; set; }
    public bool IsBye { get; set; }
    public bool IsWinner { get; set; }
}