using System.Text.Json;
using InventoryApp.Domain.Entities;

namespace InventoryApp.Application.Services;

public class ExchangeRatesService : IExchangeRatesService
{
    public bool IsStale(ExchangeRatesCache? cache, TimeSpan threshold)
    {
        if (cache is null) return true;
        return DateTime.UtcNow - cache.LastUpdatedUtc > threshold;
    }

    public ExchangeRatesCache Build(string baseCurrency, IReadOnlyDictionary<string, decimal> rates, DateTime nowUtc) =>
        new()
        {
            BaseCurrency = baseCurrency,
            RatesJson = JsonSerializer.Serialize(rates),
            LastUpdatedUtc = nowUtc
        };
}
