using InventoryApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InventoryApp.Infrastructure.Persistence.Configurations;

public class HelperPermissionsConfiguration : IEntityTypeConfiguration<HelperPermissions>
{
    public void Configure(EntityTypeBuilder<HelperPermissions> b)
    {
        b.ToTable("helper_permissions");
        b.HasKey(x => x.HelperUserId);
        b.Property(x => x.HelperUserId).ValueGeneratedNever().HasColumnName("helper_user_id");
        b.Property(x => x.CanAdd).HasColumnName("can_add").HasDefaultValue(false);
        b.Property(x => x.CanEdit).HasColumnName("can_edit").HasDefaultValue(false);
        b.Property(x => x.CanDelete).HasColumnName("can_delete").HasDefaultValue(false);
        b.Property(x => x.CanSell).HasColumnName("can_sell").HasDefaultValue(false);
        b.Property(x => x.CanRecordUse).HasColumnName("can_record_use").HasDefaultValue(false);
    }
}
