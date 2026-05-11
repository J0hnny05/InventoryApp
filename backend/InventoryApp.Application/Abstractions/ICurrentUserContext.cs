using InventoryApp.Domain.Entities;
using InventoryApp.Domain.Enums;

namespace InventoryApp.Application.Abstractions;

public interface ICurrentUserContext
{
    bool IsAuthenticated { get; }
    Guid? UserId { get; }
    string? Username { get; }
    UserRole? Role { get; }
    Guid? EffectiveOwnerId { get; }   // for Helper this is the owner; for Owner/Admin this is UserId
    HelperPermissions? HelperPermissions { get; }   // populated lazily for Helper requests, null otherwise

    Task<User> RequireUserAsync(CancellationToken ct = default);
}
