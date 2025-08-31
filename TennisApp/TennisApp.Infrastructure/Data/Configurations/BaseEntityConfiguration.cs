using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TennisApp.Domain.Common;

namespace TennisApp.Infrastructure.Data.Configurations;

public abstract class BaseEntityConfiguration<T> : IEntityTypeConfiguration<T>
    where T : BaseEntity
{
    public virtual void Configure(EntityTypeBuilder<T> builder)
    {
        builder.HasKey(e => e.Id);
        
        builder.Property(e => e.CreatedAt)
            .IsRequired();
            
        builder.Property(e => e.UpdatedAt)
            .IsRequired();
            
        builder.Property(e => e.CreatedBy)
            .HasMaxLength(100);
            
        builder.Property(e => e.UpdatedBy)
            .HasMaxLength(100);
            
        builder.Property(e => e.IsDeleted)
            .HasDefaultValue(false);
            
        builder.HasIndex(e => e.IsDeleted);
        
        ConfigureEntity(builder);
    }
    
    protected abstract void ConfigureEntity(EntityTypeBuilder<T> builder);
}