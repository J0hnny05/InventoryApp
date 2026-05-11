using InventoryApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InventoryApp.Infrastructure.Persistence.Configurations;

public class ExchangeRatesCacheConfiguration : IEntityTypeConfiguration<ExchangeRatesCache>
{
    public void Configure(EntityTypeBuilder<ExchangeRatesCache> b)
    {
        b.ToTable("exchange_rates");
        b.HasKey(x => x.BaseCurrency);
        b.Property(x => x.BaseCurrency).HasMaxLength(3).IsFixedLength().HasColumnName("base_currency");
        b.Property(x => x.RatesJson).HasColumnType("jsonb").HasColumnName("rates_json");
        b.Property(x => x.LastUpdatedUtc).HasColumnType("timestamptz").HasColumnName("last_updated_utc");
    }
}
