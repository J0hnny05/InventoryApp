using InventoryApp.Application.Features.Auth.Dtos;
using InventoryApp.Domain.Enums;

namespace InventoryApp.Application.Features.Users.Dtos;

public sealed record HelperResponse(
    Guid Id,
    string Username,
    string? Email,
    bool IsBlocked,
    DateTime CreatedAt,
    DateTime? LastLoginAt,
    HelperPermissionsDto Permissions);

public sealed record CreateHelperRequest(string Username, string Password, HelperPermissionsDto Permissions, string? Email = null);

public sealed record UpdateHelperPermissionsRequest(HelperPermissionsDto Permissions);

public sealed record AdminUserListItem(
    Guid Id,
    string Username,
    string? Email,
    UserRole Role,
    Guid? OwnerUserId,
    bool IsBlocked,
    DateTime CreatedAt,
    DateTime? LastLoginAt);
