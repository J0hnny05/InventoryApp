namespace InventoryApp.Application.Features.ExchangeRates.Dtos;

public sealed record ExchangeRatesResponse(
    string BaseCurrency,
    IReadOnlyDictionary<string, decimal> Rates,
    DateTime LastUpdatedUtc);
