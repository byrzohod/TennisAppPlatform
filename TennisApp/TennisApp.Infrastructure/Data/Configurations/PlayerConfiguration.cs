using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TennisApp.Domain.Entities;

namespace TennisApp.Infrastructure.Data.Configurations;

public class PlayerConfiguration : BaseEntityConfiguration<Player>
{
    protected override void ConfigureEntity(EntityTypeBuilder<Player> builder)
    {
        builder.ToTable("Players");
        
        builder.Property(p => p.FirstName)
            .IsRequired()
            .HasMaxLength(100);
            
        builder.Property(p => p.LastName)
            .IsRequired()
            .HasMaxLength(100);
            
        builder.Property(p => p.Country)
            .IsRequired()
            .HasMaxLength(100);
            
        builder.Property(p => p.Email)
            .HasMaxLength(255);
            
        builder.Property(p => p.Phone)
            .HasMaxLength(20);
            
        builder.Property(p => p.CoachName)
            .HasMaxLength(200);
            
        builder.Property(p => p.Gender)
            .IsRequired()
            .HasMaxLength(1)
            .HasDefaultValue("M");
            
        builder.Property(p => p.ProfileImageUrl)
            .HasMaxLength(500);
            
        builder.Property(p => p.DateOfBirth)
            .HasColumnType("timestamp without time zone");
            
        builder.HasIndex(p => p.Email)
            .IsUnique()
            .HasFilter("\"Email\" IS NOT NULL");
            
        builder.HasIndex(p => new { p.FirstName, p.LastName });
        builder.HasIndex(p => p.CurrentRanking);
        builder.HasIndex(p => p.Country);
        
        builder.HasMany(p => p.HomeMatches)
            .WithOne(m => m.Player1)
            .HasForeignKey(m => m.Player1Id)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.HasMany(p => p.AwayMatches)
            .WithOne(m => m.Player2)
            .HasForeignKey(m => m.Player2Id)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.HasMany(p => p.TournamentPlayers)
            .WithOne(tp => tp.Player)
            .HasForeignKey(tp => tp.PlayerId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.HasMany(p => p.Rankings)
            .WithOne(r => r.Player)
            .HasForeignKey(r => r.PlayerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}