using InventoryApp.Application.Auth;
using InventoryApp.Application.Features.Auth.Dtos;
using InventoryApp.Domain.Entities;

namespace InventoryApp.Application.Features.Auth;

internal static class AuthMappingHelper
{
    public static AuthUser ToAuthUser(User user) => new(
        user.Id,
        user.Username,
        user.Email,
        user.Role,
        user.EffectiveOwnerId,
        user.IsBlocked,
        user.HelperPermissions is null
            ? null
            : new HelperPermissionsDto(
                user.HelperPermissions.CanAdd,
                user.HelperPermissions.CanEdit,
                user.HelperPermissions.CanDelete,
                user.HelperPermissions.CanSell,
                user.HelperPermissions.CanRecordUse));

    public static IReadOnlyList<string> Permissions(User user) =>
        PermissionDeriver.ForUser(user, user.HelperPermissions);
}
