using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Auth;
using InventoryApp.Domain.Entities;
using InventoryApp.Domain.Enums;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace InventoryApp.Infrastructure.Auth;

public class JwtTokenService : IJwtTokenService
{
    private readonly JwtOptions _options;
    private readonly SigningCredentials _signingCredentials;

    public JwtTokenService(IOptions<JwtOptions> options)
    {
        _options = options.Value;
        if (string.IsNullOrWhiteSpace(_options.SigningKey) || _options.SigningKey.Length < 32)
            throw new InvalidOperationException("Jwt:SigningKey must be configured with at least 32 characters.");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey));
        _signingCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    }

    public IssuedAccessToken IssueAccessTokenForUser(User user, HelperPermissions? helperPermissions)
    {
        var permissions = PermissionDeriver.ForUser(user, helperPermissions);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("owner_id", user.EffectiveOwnerId.ToString())
        };

        foreach (var p in permissions)
            claims.Add(new Claim(Permissions.ClaimType, p));

        if (user.Role == UserRole.Helper && helperPermissions is not null)
        {
            var helperJson = JsonSerializer.Serialize(new
            {
                canAdd = helperPermissions.CanAdd,
                canEdit = helperPermissions.CanEdit,
                canDelete = helperPermissions.CanDelete,
                canSell = helperPermissions.CanSell,
                canRecordUse = helperPermissions.CanRecordUse
            });
            claims.Add(new Claim("helper_perms", helperJson, JsonClaimValueTypes.Json));
        }

        var lifetime = TimeSpan.FromSeconds(_options.LifetimeSeconds);
        return BuildToken(claims, lifetime, permissions);
    }

    public IssuedAccessToken IssueDemoToken(string? role, IReadOnlyList<string>? permissions, TimeSpan? lifetime = null)
    {
        var resolvedPerms = (permissions is { Count: > 0 } ? permissions : PermissionDeriver.ForDemoRole(role));

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, "demo"),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
            new(ClaimTypes.Name, "demo"),
        };
        if (!string.IsNullOrWhiteSpace(role))
            claims.Add(new Claim(ClaimTypes.Role, role!));
        foreach (var p in resolvedPerms)
            claims.Add(new Claim(Permissions.ClaimType, p));

        return BuildToken(claims, lifetime ?? TimeSpan.FromSeconds(60), resolvedPerms);
    }

    public IssuedRefreshToken IssueRefreshToken(Guid userId)
    {
        var raw = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64))
            .Replace("+", "-").Replace("/", "_").TrimEnd('=');
        var hash = HashRefreshToken(raw);
        return new IssuedRefreshToken(raw, hash, DateTime.UtcNow.AddSeconds(_options.RefreshLifetimeSeconds));
    }

    public string HashRefreshToken(string raw)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
        return Convert.ToHexString(bytes);
    }

    private IssuedAccessToken BuildToken(IEnumerable<Claim> claims, TimeSpan lifetime, IReadOnlyList<string> permissions)
    {
        var now = DateTime.UtcNow;
        var expires = now.Add(lifetime);
        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: now,
            expires: expires,
            signingCredentials: _signingCredentials);
        var encoded = new JwtSecurityTokenHandler().WriteToken(token);
        return new IssuedAccessToken(encoded, expires, permissions);
    }
}
