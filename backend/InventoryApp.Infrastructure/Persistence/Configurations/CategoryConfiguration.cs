using InventoryApp.Domain.Entities;
using InventoryApp.Infrastructure.Persistence.Seed;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InventoryApp.Infrastructure.Persistence.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> b)
    {
        b.ToTable("categories");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasMaxLength(64).HasColumnName("id");
        b.Property(x => x.Name).IsRequired().HasMaxLength(80).HasColumnName("name");
        b.Property(x => x.BuiltIn).HasColumnName("built_in").HasDefaultValue(false);
        b.Property(x => x.Color).HasMaxLength(16).HasColumnName("color");
        b.Property(x => x.Icon).HasMaxLength(64).HasColumnName("icon");
        b.Property(x => x.OwnerUserId).HasColumnName("owner_user_id");

        b.HasOne<User>()
            .WithMany()
            .HasForeignKey(x => x.OwnerUserId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasIndex(x => x.OwnerUserId);
        // Built-in (OwnerUserId is null) names are globally unique. Per-owner names are unique within owner.
        b.HasIndex(x => new { x.OwnerUserId, x.Name }).IsUnique();

        b.HasData(DefaultCategoriesSeed.Categories);
    }
}
