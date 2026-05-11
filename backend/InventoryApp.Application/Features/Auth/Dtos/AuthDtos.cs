using InventoryApp.Domain.Enums;

namespace InventoryApp.Application.Features.Auth.Dtos;

public sealed record RegisterRequest(string Username, string Password, string? Email = null);

public sealed record LoginRequest(string Username, string Password);

public sealed record RefreshRequest(string RefreshToken);

public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public sealed record HelperPermissionsDto(
    bool CanAdd, bool CanEdit, bool CanDelete, bool CanSell, bool CanRecordUse);

public sealed record AuthUser(
    Guid Id,
    string Username,
    string? Email,
    UserRole Role,
    Guid EffectiveOwnerId,
    bool IsBlocked,
    HelperPermissionsDto? HelperPermissions);

public sealed record AuthResponse(
    string AccessToken,
    DateTime AccessTokenExpiresAt,
    string RefreshToken,
    DateTime RefreshTokenExpiresAt,
    AuthUser User,
    IReadOnlyList<string> Permissions);
