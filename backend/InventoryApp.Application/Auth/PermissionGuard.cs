using InventoryApp.Application.Abstractions;
using InventoryApp.Domain.Entities;
using InventoryApp.Domain.Enums;
using InventoryApp.Domain.Exceptions;

namespace InventoryApp.Application.Auth;

/// <summary>
/// Per-action helper permission checks. Owners and Admins always pass.
/// For Helpers, checks the boolean toggles on <see cref="HelperPermissions"/>.
/// </summary>
public interface IPermissionGuard
{
    Task EnsureCanAddAsync(CancellationToken ct = default);
    Task EnsureCanEditAsync(CancellationToken ct = default);
    Task EnsureCanDeleteAsync(CancellationToken ct = default);
    Task EnsureCanSellAsync(CancellationToken ct = default);
    Task EnsureCanRecordUseAsync(CancellationToken ct = default);
    Task EnsureCanReadAsync(CancellationToken ct = default);
}

public class PermissionGuard : IPermissionGuard
{
    private readonly ICurrentUserContext _current;
    public PermissionGuard(ICurrentUserContext current) => _current = current;

    public Task EnsureCanReadAsync(CancellationToken ct = default) => CheckAsync(p => true, "read", ct);
    public Task EnsureCanAddAsync(CancellationToken ct = default) => CheckAsync(p => p.CanAdd, "add items", ct);
    public Task EnsureCanEditAsync(CancellationToken ct = default) => CheckAsync(p => p.CanEdit, "edit items", ct);
    public Task EnsureCanDeleteAsync(CancellationToken ct = default) => CheckAsync(p => p.CanDelete, "delete items", ct);
    public Task EnsureCanSellAsync(CancellationToken ct = default) => CheckAsync(p => p.CanSell, "sell items", ct);
    public Task EnsureCanRecordUseAsync(CancellationToken ct = default) => CheckAsync(p => p.CanRecordUse, "record uses", ct);

    private async Task CheckAsync(Func<HelperPermissions, bool> predicate, string action, CancellationToken ct)
    {
        var user = await _current.RequireUserAsync(ct);
        if (user.Role is UserRole.Owner or UserRole.Admin) return;
        // Helper
        if (user.HelperPermissions is null || !predicate(user.HelperPermissions))
            throw new ForbiddenException($"You don't have permission to {action}.");
    }
}
