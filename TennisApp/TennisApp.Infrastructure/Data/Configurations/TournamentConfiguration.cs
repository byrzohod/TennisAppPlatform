using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TennisApp.Domain.Entities;

namespace TennisApp.Infrastructure.Data.Configurations;

public class TournamentConfiguration : BaseEntityConfiguration<Tournament>
{
    protected override void ConfigureEntity(EntityTypeBuilder<Tournament> builder)
    {
        builder.ToTable("Tournaments");
        
        builder.Property(t => t.Name)
            .IsRequired()
            .HasMaxLength(200);
            
        builder.Property(t => t.Location)
            .IsRequired()
            .HasMaxLength(200);
            
        builder.Property(t => t.Description)
            .HasMaxLength(2000);
            
        builder.Property(t => t.LogoUrl)
            .HasMaxLength(500);
            
        builder.Property(t => t.PrizeMoney)
            .HasPrecision(18, 2);
            
        builder.Property(t => t.Type)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);
            
        builder.Property(t => t.Surface)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);
            
        builder.Property(t => t.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);
            
        builder.HasIndex(t => t.StartDate);
        builder.HasIndex(t => t.Status);
        builder.HasIndex(t => new { t.StartDate, t.EndDate });
            
        builder.HasMany(t => t.Matches)
            .WithOne(m => m.Tournament)
            .HasForeignKey(m => m.TournamentId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.HasMany(t => t.TournamentPlayers)
            .WithOne(tp => tp.Tournament)
            .HasForeignKey(tp => tp.TournamentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}