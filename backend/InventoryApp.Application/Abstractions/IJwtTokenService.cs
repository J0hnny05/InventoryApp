using InventoryApp.Domain.Entities;

namespace InventoryApp.Application.Abstractions;

public sealed record IssuedAccessToken(string AccessToken, DateTime ExpiresAtUtc, IReadOnlyList<string> Permissions);
public sealed record IssuedRefreshToken(string RefreshToken, string TokenHash, DateTime ExpiresAtUtc);

public interface IJwtTokenService
{
    /// <summary>Issue an access token for a real user (with role + derived permissions + helper toggles).</summary>
    IssuedAccessToken IssueAccessTokenForUser(User user, HelperPermissions? helperPermissions);

    /// <summary>Issue a no-user token used by the Lab 7 demo /token endpoint.</summary>
    IssuedAccessToken IssueDemoToken(string? role, IReadOnlyList<string>? permissions, TimeSpan? lifetime = null);

    IssuedRefreshToken IssueRefreshToken(Guid userId);

    /// <summary>Hash a raw refresh token string (caller-supplied).</summary>
    string HashRefreshToken(string raw);
}
