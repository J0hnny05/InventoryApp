using Microsoft.AspNetCore.Authorization;

namespace InventoryApp.Api.Authorization;

public class PermissionRequirement : IAuthorizationRequirement
{
    public string Permission { get; }
    public PermissionRequirement(string permission) => Permission = permission;
}

public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        var hasPermission = context.User.Claims
            .Any(c => c.Type == Application.Auth.Permissions.ClaimType
                  && string.Equals(c.Value, requirement.Permission, StringComparison.OrdinalIgnoreCase));
        if (hasPermission) context.Succeed(requirement);
        return Task.CompletedTask;
    }
}
