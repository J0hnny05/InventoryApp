using InventoryApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InventoryApp.Infrastructure.Persistence.Configurations;

public class InventoryItemConfiguration : IEntityTypeConfiguration<InventoryItem>
{
    public void Configure(EntityTypeBuilder<InventoryItem> b)
    {
        b.ToTable("inventory_items");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).ValueGeneratedNever().HasColumnName("id");
        b.Property(x => x.OwnerUserId).HasColumnName("owner_user_id");
        b.Property(x => x.Name).IsRequired().HasMaxLength(120).HasColumnName("name");
        b.Property(x => x.CategoryId).IsRequired().HasMaxLength(64).HasColumnName("category_id");
        b.Property(x => x.PurchasePrice).HasPrecision(18, 2).HasColumnName("purchase_price");
        b.Property(x => x.PurchaseDate).HasColumnType("date").HasColumnName("purchase_date");
        b.Property(x => x.Currency).IsRequired().HasMaxLength(3).IsFixedLength().HasColumnName("currency");
        b.Property(x => x.Description).HasColumnName("description");
        b.Property(x => x.Brand).HasMaxLength(120).HasColumnName("brand");
        b.Property(x => x.Condition).HasConversion<string>().HasMaxLength(16).HasColumnName("condition");
        b.Property(x => x.Location).HasMaxLength(120).HasColumnName("location");
        b.Property(x => x.Tags).HasColumnType("text[]").HasColumnName("tags");
        b.Property(x => x.Pinned).HasColumnName("pinned").HasDefaultValue(false);
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(16).IsRequired().HasColumnName("status");
        b.Property(x => x.SoldAt).HasColumnType("date").HasColumnName("sold_at");
        b.Property(x => x.SalePrice).HasPrecision(18, 2).HasColumnName("sale_price");
        b.Property(x => x.UseCount).HasColumnName("use_count").HasDefaultValue(0);
        b.Property(x => x.LastUsedAt).HasColumnType("timestamptz").HasColumnName("last_used_at");
        b.Property(x => x.ViewCount).HasColumnName("view_count").HasDefaultValue(0);
        b.Property(x => x.CreatedAt).HasColumnType("timestamptz").HasColumnName("created_at");
        b.Property(x => x.UpdatedAt).HasColumnType("timestamptz").HasColumnName("updated_at");

        b.HasOne(x => x.Category)
            .WithMany()
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasOne<User>()
            .WithMany()
            .HasForeignKey(x => x.OwnerUserId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasIndex(x => x.OwnerUserId);
        b.HasIndex(x => x.CategoryId);
        b.HasIndex(x => x.Status);
        b.HasIndex(x => new { x.OwnerUserId, x.Status, x.Pinned, x.CreatedAt });
    }
}
