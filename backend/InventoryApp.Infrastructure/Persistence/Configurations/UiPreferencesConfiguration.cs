using InventoryApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InventoryApp.Infrastructure.Persistence.Configurations;

public class UiPreferencesConfiguration : IEntityTypeConfiguration<UiPreferences>
{
    public void Configure(EntityTypeBuilder<UiPreferences> b)
    {
        b.ToTable("ui_preferences");
        b.HasKey(x => x.UserId);
        b.Property(x => x.UserId).ValueGeneratedNever().HasColumnName("user_id");
        b.Property(x => x.DefaultCurrency).IsRequired().HasMaxLength(3).IsFixedLength().HasColumnName("default_currency");
        b.Property(x => x.Theme).HasConversion<string>().HasMaxLength(16).HasColumnName("theme");
        b.Property(x => x.InventorySort).HasConversion<string>().HasMaxLength(32).HasColumnName("inventory_sort");
        b.Property(x => x.SearchTerm).HasMaxLength(200).HasColumnName("search_term");
        b.Property(x => x.FilterCategoryId).HasMaxLength(64).HasColumnName("filter_category_id");

        b.HasOne<User>()
            .WithOne()
            .HasForeignKey<UiPreferences>(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasOne<Category>()
            .WithMany()
            .HasForeignKey(x => x.FilterCategoryId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
