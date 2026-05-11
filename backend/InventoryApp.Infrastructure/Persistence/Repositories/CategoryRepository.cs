using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Common;
using InventoryApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace InventoryApp.Infrastructure.Persistence.Repositories;

public class CategoryRepository : ICategoryRepository
{
    private readonly AppDbContext _db;
    public CategoryRepository(AppDbContext db) => _db = db;

    public Task<Category?> GetByIdForOwnerAsync(string id, Guid ownerId, CancellationToken ct = default) =>
        _db.Categories.FirstOrDefaultAsync(c => c.Id == id && (c.OwnerUserId == null || c.OwnerUserId == ownerId), ct);

    public async Task<(List<Category> Items, int Total)> ListForOwnerAsync(Guid ownerId, PagedQuery page, CancellationToken ct = default)
    {
        var q = _db.Categories.Where(c => c.OwnerUserId == null || c.OwnerUserId == ownerId)
                              .OrderByDescending(c => c.BuiltIn).ThenBy(c => c.Name);
        var total = await q.CountAsync(ct);
        var items = await q.Skip(page.Skip).Take(page.Take).ToListAsync(ct);
        return (items, total);
    }

    public Task<bool> ExistsForOwnerAsync(string id, Guid ownerId, CancellationToken ct = default) =>
        _db.Categories.AnyAsync(c => c.Id == id && (c.OwnerUserId == null || c.OwnerUserId == ownerId), ct);

    public Task<bool> NameExistsForOwnerAsync(string name, Guid ownerId, string? excludeId = null, CancellationToken ct = default) =>
        _db.Categories.AnyAsync(c => c.Name == name
            && (c.OwnerUserId == null || c.OwnerUserId == ownerId)
            && (excludeId == null || c.Id != excludeId), ct);

    public async Task AddAsync(Category category, CancellationToken ct = default) =>
        await _db.Categories.AddAsync(category, ct);

    public void Remove(Category category) => _db.Categories.Remove(category);

    public async Task ReplaceUserDefinedForOwnerAsync(Guid ownerId, IEnumerable<Category> categories, CancellationToken ct = default)
    {
        var existing = await _db.Categories.Where(c => c.OwnerUserId == ownerId).ToListAsync(ct);
        _db.Categories.RemoveRange(existing);
        foreach (var c in categories.Where(c => !c.BuiltIn))
        {
            c.OwnerUserId = ownerId;
            await _db.Categories.AddAsync(c, ct);
        }
    }

    public Task<bool> AnyItemsUseCategoryAsync(string id, Guid ownerId, CancellationToken ct = default) =>
        _db.InventoryItems.AnyAsync(i => i.OwnerUserId == ownerId && i.CategoryId == id, ct);
}
