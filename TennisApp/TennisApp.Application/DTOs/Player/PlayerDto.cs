namespace TennisApp.Application.DTOs.Player;

public class PlayerDto
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}";
    public string Country { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public int Age => DateTime.Now.Year - DateOfBirth.Year;
    public string? ProfileImageUrl { get; set; }
    public int CurrentRanking { get; set; }
    public int RankingPoints { get; set; }
}

public class CreatePlayerDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string? ProfileImageUrl { get; set; }
}

public class UpdatePlayerDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string? ProfileImageUrl { get; set; }
    public int CurrentRanking { get; set; }
    public int RankingPoints { get; set; }
}