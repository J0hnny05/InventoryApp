using InventoryApp.Domain.Entities;

namespace InventoryApp.Application.Abstractions;

public interface IExchangeRatesRepository
{
    Task<ExchangeRatesCache?> GetAsync(string baseCurrency, CancellationToken ct = default);
    Task UpsertAsync(ExchangeRatesCache cache, CancellationToken ct = default);
}
