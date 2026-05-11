namespace InventoryApp.Application.Features.Auth.Dtos;

public sealed record TokenRequest(string? Role = null, IReadOnlyList<string>? Permissions = null);

public sealed record TokenResponse(
    string AccessToken,
    DateTime ExpiresAt,
    string? Role,
    IReadOnlyList<string> Permissions);
