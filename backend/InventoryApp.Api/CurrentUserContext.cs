using System.Security.Claims;
using System.Text.Json;
using InventoryApp.Application.Abstractions;
using InventoryApp.Domain.Entities;
using InventoryApp.Domain.Enums;
using InventoryApp.Domain.Exceptions;

namespace InventoryApp.Api;

public class CurrentUserContext : ICurrentUserContext
{
    private readonly IHttpContextAccessor _http;
    private readonly IUserRepository _users;
    private User? _cachedUser;

    public CurrentUserContext(IHttpContextAccessor http, IUserRepository users)
    {
        _http = http;
        _users = users;
    }

    public bool IsAuthenticated => _http.HttpContext?.User?.Identity?.IsAuthenticated == true;

    public Guid? UserId
    {
        get
        {
            var v = _http.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(v, out var g) ? g : null;
        }
    }

    public string? Username => _http.HttpContext?.User.FindFirstValue(ClaimTypes.Name);

    public UserRole? Role
    {
        get
        {
            var v = _http.HttpContext?.User.FindFirstValue(ClaimTypes.Role);
            return Enum.TryParse<UserRole>(v, true, out var r) ? r : null;
        }
    }

    public Guid? EffectiveOwnerId
    {
        get
        {
            var v = _http.HttpContext?.User.FindFirst("owner_id")?.Value;
            return Guid.TryParse(v, out var g) ? g : UserId;
        }
    }

    public HelperPermissions? HelperPermissions
    {
        get
        {
            var json = _http.HttpContext?.User.FindFirst("helper_perms")?.Value;
            if (string.IsNullOrEmpty(json)) return null;
            try
            {
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;
                return new HelperPermissions
                {
                    HelperUserId = UserId ?? Guid.Empty,
                    CanAdd = root.TryGetProperty("canAdd", out var a) && a.GetBoolean(),
                    CanEdit = root.TryGetProperty("canEdit", out var e) && e.GetBoolean(),
                    CanDelete = root.TryGetProperty("canDelete", out var d) && d.GetBoolean(),
                    CanSell = root.TryGetProperty("canSell", out var s) && s.GetBoolean(),
                    CanRecordUse = root.TryGetProperty("canRecordUse", out var u) && u.GetBoolean()
                };
            }
            catch { return null; }
        }
    }

    public async Task<User> RequireUserAsync(CancellationToken ct = default)
    {
        if (_cachedUser is not null) return _cachedUser;
        if (UserId is null) throw new UnauthorizedException();
        var user = await _users.GetByIdAsync(UserId.Value, includePermissions: true, ct);
        if (user is null) throw new UnauthorizedException("User no longer exists.");
        if (user.IsBlocked) throw new AccountBlockedException();
        _cachedUser = user;
        return user;
    }
}
