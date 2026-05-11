using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Common;
using InventoryApp.Application.Features.InventoryItems.Dtos;
using InventoryApp.Domain.Entities;
using InventoryApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InventoryApp.Infrastructure.Persistence.Repositories;

public class InventoryItemRepository : IInventoryItemRepository
{
    private readonly AppDbContext _db;
    public InventoryItemRepository(AppDbContext db) => _db = db;

    public Task<InventoryItem?> GetByIdAsync(Guid id, Guid ownerId, CancellationToken ct = default) =>
        _db.InventoryItems.FirstOrDefaultAsync(i => i.Id == id && i.OwnerUserId == ownerId, ct);

    public async Task<(List<InventoryItem> Items, int Total)> ListAsync(
        Guid ownerId, InventoryItemListQuery filter, PagedQuery page, CancellationToken ct = default)
    {
        IQueryable<InventoryItem> q = _db.InventoryItems.Where(i => i.OwnerUserId == ownerId);

        if (filter.Status.HasValue)
            q = q.Where(i => i.Status == filter.Status.Value);

        if (!string.IsNullOrWhiteSpace(filter.CategoryId))
            q = q.Where(i => i.CategoryId == filter.CategoryId);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var s = filter.Search.Trim();
            q = q.Where(i =>
                EF.Functions.ILike(i.Name, $"%{s}%") ||
                (i.Brand != null && EF.Functions.ILike(i.Brand, $"%{s}%")) ||
                (i.Location != null && EF.Functions.ILike(i.Location, $"%{s}%")) ||
                i.Tags.Any(t => EF.Functions.ILike(t, $"%{s}%")));
        }

        q = (filter.Sort ?? InventorySort.PinnedRecent) switch
        {
            InventorySort.PriceDesc => q.OrderByDescending(i => i.PurchasePrice),
            InventorySort.PriceAsc => q.OrderBy(i => i.PurchasePrice),
            InventorySort.NameAsc => q.OrderBy(i => i.Name),
            _ => q.OrderByDescending(i => i.Pinned).ThenByDescending(i => i.CreatedAt)
        };

        var total = await q.CountAsync(ct);
        var items = await q.Skip(page.Skip).Take(page.Take).ToListAsync(ct);
        return (items, total);
    }

    public async Task AddAsync(InventoryItem item, CancellationToken ct = default) =>
        await _db.InventoryItems.AddAsync(item, ct);

    public void Remove(InventoryItem item) => _db.InventoryItems.Remove(item);

    public async Task ReplaceAllAsync(Guid ownerId, IEnumerable<InventoryItem> items, CancellationToken ct = default)
    {
        var existing = await _db.InventoryItems.Where(i => i.OwnerUserId == ownerId).ToListAsync(ct);
        _db.InventoryItems.RemoveRange(existing);
        foreach (var i in items)
        {
            i.OwnerUserId = ownerId;
            await _db.InventoryItems.AddAsync(i, ct);
        }
    }

    public Task<List<InventoryItem>> ListAllForOwnerAsync(Guid ownerId, CancellationToken ct = default) =>
        _db.InventoryItems.Where(i => i.OwnerUserId == ownerId).ToListAsync(ct);
}
