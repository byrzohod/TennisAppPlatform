using TennisApp.Domain.Common;
using TennisApp.Domain.Enums;

namespace TennisApp.Domain.Entities;

public class TournamentPlayer : BaseEntity
{
    public int TournamentId { get; set; }
    public int PlayerId { get; set; }
    public int? Seed { get; set; }
    public bool IsWildcard { get; set; }
    public bool IsQualifier { get; set; }
    public DateTime RegisteredAt { get; set; }
    public DateTime? CheckedInAt { get; set; }
    public RegistrationStatus Status { get; set; } = RegistrationStatus.Pending;
    public string? Notes { get; set; }
    
    // Navigation properties
    public Tournament Tournament { get; set; } = null!;
    public Player Player { get; set; } = null!;
}