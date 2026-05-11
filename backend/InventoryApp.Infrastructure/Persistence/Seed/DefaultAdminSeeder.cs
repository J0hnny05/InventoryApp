using InventoryApp.Application.Abstractions;
using InventoryApp.Domain.Entities;
using InventoryApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InventoryApp.Infrastructure.Persistence.Seed;

public static class DefaultAdminSeeder
{
    public static readonly Guid DefaultAdminId = new("00000000-0000-0000-0000-000000000001");

    public static async Task EnsureAsync(AppDbContext db, IPasswordHasher hasher,
        string username = "admin", string password = "admin", CancellationToken ct = default)
    {
        var exists = await db.Users.AnyAsync(u => u.Role == UserRole.Admin, ct);
        if (exists) return;

        var now = DateTime.UtcNow;
        var admin = new User
        {
            Id = DefaultAdminId,
            Username = username,
            Email = null,
            PasswordHash = hasher.Hash(password),
            Role = UserRole.Admin,
            OwnerUserId = null,
            IsBlocked = false,
            CreatedAt = now,
            UpdatedAt = now
        };
        await db.Users.AddAsync(admin, ct);
        await db.SaveChangesAsync(ct);
    }
}
