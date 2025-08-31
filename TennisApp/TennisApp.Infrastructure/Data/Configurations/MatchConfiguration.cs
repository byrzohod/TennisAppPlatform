using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TennisApp.Domain.Entities;

namespace TennisApp.Infrastructure.Data.Configurations;

public class MatchConfiguration : BaseEntityConfiguration<Match>
{
    protected override void ConfigureEntity(EntityTypeBuilder<Match> builder)
    {
        builder.ToTable("Matches");
        
        builder.Property(m => m.Round)
            .IsRequired()
            .HasMaxLength(50);
            
        builder.Property(m => m.Court)
            .HasMaxLength(50);
            
        builder.Property(m => m.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);
            
        builder.Property(m => m.Duration)
            .HasDefaultValue(0);
            
        builder.HasOne(m => m.Tournament)
            .WithMany(t => t.Matches)
            .HasForeignKey(m => m.TournamentId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.HasOne(m => m.Player1)
            .WithMany(p => p.HomeMatches)
            .HasForeignKey(m => m.Player1Id)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.HasOne(m => m.Player2)
            .WithMany(p => p.AwayMatches)
            .HasForeignKey(m => m.Player2Id)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.HasOne(m => m.Winner)
            .WithMany()
            .HasForeignKey(m => m.WinnerId)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.HasIndex(m => new { m.TournamentId, m.Round });
        builder.HasIndex(m => m.ScheduledTime);
        builder.HasIndex(m => m.Status);
        builder.HasIndex(m => new { m.Player1Id, m.Player2Id });
    }
}