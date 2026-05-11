using InventoryApp.Domain.Entities;

namespace InventoryApp.Application.Services;

public interface IExchangeRatesService
{
    bool IsStale(ExchangeRatesCache? cache, TimeSpan threshold);
    ExchangeRatesCache Build(string baseCurrency, IReadOnlyDictionary<string, decimal> rates, DateTime nowUtc);
}
