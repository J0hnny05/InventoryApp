using InventoryApp.Application.Abstractions;
using InventoryApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace InventoryApp.Infrastructure.Persistence.Repositories;

public class ExchangeRatesRepository : IExchangeRatesRepository
{
    private readonly AppDbContext _db;
    public ExchangeRatesRepository(AppDbContext db) => _db = db;

    public Task<ExchangeRatesCache?> GetAsync(string baseCurrency, CancellationToken ct = default) =>
        _db.ExchangeRates.FirstOrDefaultAsync(r => r.BaseCurrency == baseCurrency, ct);

    public async Task UpsertAsync(ExchangeRatesCache cache, CancellationToken ct = default)
    {
        var existing = await _db.ExchangeRates.FirstOrDefaultAsync(r => r.BaseCurrency == cache.BaseCurrency, ct);
        if (existing is null)
        {
            await _db.ExchangeRates.AddAsync(cache, ct);
        }
        else
        {
            existing.RatesJson = cache.RatesJson;
            existing.LastUpdatedUtc = cache.LastUpdatedUtc;
        }
    }
}
