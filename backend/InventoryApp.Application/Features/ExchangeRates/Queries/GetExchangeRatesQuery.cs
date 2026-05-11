using System.Text.Json;
using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Features.ExchangeRates.Dtos;
using InventoryApp.Application.Services;
using MediatR;
using Microsoft.Extensions.Options;

namespace InventoryApp.Application.Features.ExchangeRates.Queries;

public sealed record GetExchangeRatesQuery(string BaseCurrency = "EUR") : IRequest<ExchangeRatesResponse>;

public class GetExchangeRatesHandler : IRequestHandler<GetExchangeRatesQuery, ExchangeRatesResponse>
{
    private readonly IExchangeRatesRepository _repo;
    private readonly IExchangeRatesApiClient _api;
    private readonly IExchangeRatesService _svc;
    private readonly IUnitOfWork _uow;
    private readonly ExchangeRatesOptions _options;

    public GetExchangeRatesHandler(IExchangeRatesRepository repo, IExchangeRatesApiClient api,
        IExchangeRatesService svc, IUnitOfWork uow, IOptions<ExchangeRatesOptions> options)
    {
        _repo = repo; _api = api; _svc = svc; _uow = uow; _options = options.Value;
    }

    public async Task<ExchangeRatesResponse> Handle(GetExchangeRatesQuery q, CancellationToken ct)
    {
        var threshold = TimeSpan.FromHours(_options.StaleAfterHours);

        var existing = await _repo.GetAsync(q.BaseCurrency, ct);
        if (_svc.IsStale(existing, threshold))
        {
            try
            {
                var fresh = await _api.FetchAsync(q.BaseCurrency, ct);
                if (fresh.Count > 0)
                {
                    var cache = _svc.Build(q.BaseCurrency, fresh, DateTime.UtcNow);
                    await _repo.UpsertAsync(cache, ct);
                    await _uow.SaveChangesAsync(ct);
                    existing = cache;
                }
            }
            catch
            {
                if (existing is null) throw;
            }
        }

        var rates = string.IsNullOrWhiteSpace(existing?.RatesJson)
            ? new Dictionary<string, decimal>()
            : JsonSerializer.Deserialize<Dictionary<string, decimal>>(existing!.RatesJson) ?? new();

        return new ExchangeRatesResponse(q.BaseCurrency, rates, existing?.LastUpdatedUtc ?? DateTime.MinValue);
    }
}
