using System.Text.Json;
using InventoryApp.Application.Abstractions;

namespace InventoryApp.Infrastructure.ExternalApis;

public class OpenErApiClient : IExchangeRatesApiClient
{
    private readonly HttpClient _http;
    private readonly string _endpoint;

    public OpenErApiClient(HttpClient http, string endpoint)
    {
        _http = http;
        _endpoint = endpoint;
    }

    public async Task<IReadOnlyDictionary<string, decimal>> FetchAsync(string baseCurrency, CancellationToken ct = default)
    {
        using var stream = await _http.GetStreamAsync(_endpoint, ct);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
        if (!doc.RootElement.TryGetProperty("rates", out var rates))
            return new Dictionary<string, decimal>();

        var result = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
        foreach (var prop in rates.EnumerateObject())
        {
            if (prop.Value.TryGetDecimal(out var v)) result[prop.Name] = v;
        }
        return result;
    }
}
