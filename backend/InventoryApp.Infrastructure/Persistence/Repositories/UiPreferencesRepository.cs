using InventoryApp.Application.Abstractions;
using InventoryApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace InventoryApp.Infrastructure.Persistence.Repositories;

public class UiPreferencesRepository : IUiPreferencesRepository
{
    private readonly AppDbContext _db;
    public UiPreferencesRepository(AppDbContext db) => _db = db;

    public async Task<UiPreferences> GetForUserAsync(Guid userId, CancellationToken ct = default)
    {
        var prefs = await _db.UiPreferences.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        if (prefs is null)
        {
            prefs = new UiPreferences { UserId = userId };
            await _db.UiPreferences.AddAsync(prefs, ct);
            await _db.SaveChangesAsync(ct);
        }
        return prefs;
    }
}
