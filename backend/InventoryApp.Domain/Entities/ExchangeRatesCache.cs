namespace InventoryApp.Domain.Entities;

public class ExchangeRatesCache
{
    public string BaseCurrency { get; set; } = "EUR";
    public string RatesJson { get; set; } = "{}";
    public DateTime LastUpdatedUtc { get; set; }
}
