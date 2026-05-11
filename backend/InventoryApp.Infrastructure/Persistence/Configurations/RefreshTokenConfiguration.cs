using InventoryApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InventoryApp.Infrastructure.Persistence.Configurations;

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> b)
    {
        b.ToTable("refresh_tokens");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).ValueGeneratedNever().HasColumnName("id");
        b.Property(x => x.UserId).HasColumnName("user_id");
        b.Property(x => x.TokenHash).IsRequired().HasMaxLength(128).HasColumnName("token_hash");
        b.Property(x => x.CreatedAt).HasColumnType("timestamptz").HasColumnName("created_at");
        b.Property(x => x.ExpiresAt).HasColumnType("timestamptz").HasColumnName("expires_at");
        b.Property(x => x.RevokedAt).HasColumnType("timestamptz").HasColumnName("revoked_at");
        b.Property(x => x.ReplacedByTokenHash).HasMaxLength(128).HasColumnName("replaced_by_token_hash");

        b.HasIndex(x => x.TokenHash).IsUnique();
        b.HasIndex(x => x.UserId);

        b.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
