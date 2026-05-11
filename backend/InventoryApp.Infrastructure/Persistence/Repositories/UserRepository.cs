using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Common;
using InventoryApp.Domain.Entities;
using InventoryApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InventoryApp.Infrastructure.Persistence.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _db;
    public UserRepository(AppDbContext db) => _db = db;

    public Task<User?> GetByIdAsync(Guid id, bool includePermissions = false, CancellationToken ct = default)
    {
        IQueryable<User> q = _db.Users;
        if (includePermissions) q = q.Include(u => u.HelperPermissions);
        return q.FirstOrDefaultAsync(u => u.Id == id, ct);
    }

    public Task<User?> GetByUsernameAsync(string username, bool includePermissions = false, CancellationToken ct = default)
    {
        var normalized = username.Trim().ToLower();
        IQueryable<User> q = _db.Users;
        if (includePermissions) q = q.Include(u => u.HelperPermissions);
        return q.FirstOrDefaultAsync(u => u.Username.ToLower() == normalized, ct);
    }

    public Task<bool> UsernameExistsAsync(string username, CancellationToken ct = default)
    {
        var normalized = username.Trim().ToLower();
        return _db.Users.AnyAsync(u => u.Username.ToLower() == normalized, ct);
    }

    public async Task AddAsync(User user, CancellationToken ct = default) =>
        await _db.Users.AddAsync(user, ct);

    public void Remove(User user) => _db.Users.Remove(user);

    public async Task<(List<User> Items, int Total)> ListHelpersAsync(Guid ownerId, PagedQuery page, CancellationToken ct = default)
    {
        var q = _db.Users.Where(u => u.Role == UserRole.Helper && u.OwnerUserId == ownerId);
        var total = await q.CountAsync(ct);
        var items = await q.Include(u => u.HelperPermissions)
                           .OrderBy(u => u.Username)
                           .Skip(page.Skip).Take(page.Take)
                           .ToListAsync(ct);
        return (items, total);
    }

    public async Task<(List<User> Items, int Total)> ListAllAsync(PagedQuery page, UserRole? roleFilter, CancellationToken ct = default)
    {
        IQueryable<User> q = _db.Users;
        if (roleFilter.HasValue) q = q.Where(u => u.Role == roleFilter.Value);
        var total = await q.CountAsync(ct);
        var items = await q.OrderBy(u => u.Username)
                           .Skip(page.Skip).Take(page.Take)
                           .ToListAsync(ct);
        return (items, total);
    }
}
