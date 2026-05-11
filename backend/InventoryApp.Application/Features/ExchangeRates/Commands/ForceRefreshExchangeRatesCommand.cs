using System.Text.Json;
using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Features.ExchangeRates.Dtos;
using InventoryApp.Application.Services;
using MediatR;

namespace InventoryApp.Application.Features.ExchangeRates.Commands;

public sealed record ForceRefreshExchangeRatesCommand(string BaseCurrency = "EUR")
    : IRequest<ExchangeRatesResponse>;

public class ForceRefreshHandler : IRequestHandler<ForceRefreshExchangeRatesCommand, ExchangeRatesResponse>
{
    private readonly IExchangeRatesRepository _repo;
    private readonly IExchangeRatesApiClient _api;
    private readonly IExchangeRatesService _svc;
    private readonly IUnitOfWork _uow;

    public ForceRefreshHandler(IExchangeRatesRepository repo, IExchangeRatesApiClient api,
        IExchangeRatesService svc, IUnitOfWork uow)
    {
        _repo = repo; _api = api; _svc = svc; _uow = uow;
    }

    public async Task<ExchangeRatesResponse> Handle(ForceRefreshExchangeRatesCommand cmd, CancellationToken ct)
    {
        var fresh = await _api.FetchAsync(cmd.BaseCurrency, ct);
        var cache = _svc.Build(cmd.BaseCurrency, fresh, DateTime.UtcNow);
        await _repo.UpsertAsync(cache, ct);
        await _uow.SaveChangesAsync(ct);
        var rates = JsonSerializer.Deserialize<Dictionary<string, decimal>>(cache.RatesJson) ?? new();
        return new ExchangeRatesResponse(cmd.BaseCurrency, rates, cache.LastUpdatedUtc);
    }
}
