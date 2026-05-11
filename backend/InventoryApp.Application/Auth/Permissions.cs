using InventoryApp.Domain.Entities;
using InventoryApp.Domain.Enums;

namespace InventoryApp.Application.Auth;

public static class Permissions
{
    public const string Read = "READ";
    public const string Write = "WRITE";
    public const string Delete = "DELETE";
    public const string Admin = "ADMIN";

    public const string ClaimType = "permissions";
}

public static class Roles
{
    public const string Owner = "Owner";
    public const string Helper = "Helper";
    public const string Admin = "Admin";
}

public static class PermissionPolicies
{
    public const string RequireRead = "RequireRead";
    public const string RequireWrite = "RequireWrite";
    public const string RequireDelete = "RequireDelete";
    public const string RequireAdmin = "RequireAdmin";
    public const string RequireOwnerOrAdmin = "RequireOwnerOrAdmin";
}

public static class PermissionDeriver
{
    public static IReadOnlyList<string> ForUser(User user, HelperPermissions? helperPerms)
    {
        return user.Role switch
        {
            UserRole.Admin => new[] { Permissions.Read, Permissions.Write, Permissions.Delete, Permissions.Admin },
            UserRole.Owner => new[] { Permissions.Read, Permissions.Write, Permissions.Delete },
            UserRole.Helper => DeriveForHelper(helperPerms),
            _ => Array.Empty<string>()
        };
    }

    private static IReadOnlyList<string> DeriveForHelper(HelperPermissions? p)
    {
        var list = new List<string> { Permissions.Read };
        if (p is null) return list;
        var canWrite = p.CanAdd || p.CanEdit || p.CanSell || p.CanRecordUse;
        if (canWrite) list.Add(Permissions.Write);
        if (p.CanDelete) list.Add(Permissions.Delete);
        return list;
    }

    public static IReadOnlyList<string> ForDemoRole(string? role) => role?.Trim().ToUpperInvariant() switch
    {
        "ADMIN" => new[] { Permissions.Read, Permissions.Write, Permissions.Delete, Permissions.Admin },
        "WRITER" => new[] { Permissions.Read, Permissions.Write },
        "VISITOR" => new[] { Permissions.Read },
        _ => Array.Empty<string>()
    };
}
