namespace InventoryApp.Application.Abstractions;

public interface IExchangeRatesApiClient
{
    Task<IReadOnlyDictionary<string, decimal>> FetchAsync(string baseCurrency, CancellationToken ct = default);
}
