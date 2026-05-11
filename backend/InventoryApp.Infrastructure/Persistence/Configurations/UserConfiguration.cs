using InventoryApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InventoryApp.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> b)
    {
        b.ToTable("users");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).ValueGeneratedNever().HasColumnName("id");
        b.Property(x => x.Username).IsRequired().HasMaxLength(64).HasColumnName("username");
        b.Property(x => x.Email).HasMaxLength(254).HasColumnName("email");
        b.Property(x => x.PasswordHash).IsRequired().HasMaxLength(512).HasColumnName("password_hash");
        b.Property(x => x.Role).HasConversion<string>().HasMaxLength(16).IsRequired().HasColumnName("role");
        b.Property(x => x.OwnerUserId).HasColumnName("owner_user_id");
        b.Property(x => x.IsBlocked).HasColumnName("is_blocked").HasDefaultValue(false);
        b.Property(x => x.CreatedAt).HasColumnType("timestamptz").HasColumnName("created_at");
        b.Property(x => x.UpdatedAt).HasColumnType("timestamptz").HasColumnName("updated_at");
        b.Property(x => x.LastLoginAt).HasColumnType("timestamptz").HasColumnName("last_login_at");

        b.HasIndex(x => x.Username).IsUnique();
        b.HasIndex(x => x.OwnerUserId);

        b.HasOne(x => x.OwnerUser)
            .WithMany()
            .HasForeignKey(x => x.OwnerUserId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasOne(x => x.HelperPermissions)
            .WithOne(p => p.HelperUser!)
            .HasForeignKey<HelperPermissions>(p => p.HelperUserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
