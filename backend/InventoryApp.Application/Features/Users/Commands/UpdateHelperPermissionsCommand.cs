using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Features.Auth.Dtos;
using InventoryApp.Application.Features.Users.Dtos;
using InventoryApp.Domain.Entities;
using InventoryApp.Domain.Enums;
using InventoryApp.Domain.Exceptions;
using MediatR;

namespace InventoryApp.Application.Features.Users.Commands;

public sealed record UpdateHelperPermissionsCommand(Guid HelperId, HelperPermissionsDto Permissions)
    : IRequest<HelperResponse>;

public class UpdateHelperPermissionsHandler : IRequestHandler<UpdateHelperPermissionsCommand, HelperResponse>
{
    private readonly IUserRepository _users;
    private readonly ICurrentUserContext _current;
    private readonly IRefreshTokenRepository _refreshTokens;
    private readonly IUnitOfWork _uow;

    public UpdateHelperPermissionsHandler(IUserRepository users, ICurrentUserContext current,
        IRefreshTokenRepository refreshTokens, IUnitOfWork uow)
    {
        _users = users; _current = current; _refreshTokens = refreshTokens; _uow = uow;
    }

    public async Task<HelperResponse> Handle(UpdateHelperPermissionsCommand cmd, CancellationToken ct)
    {
        var owner = await _current.RequireUserAsync(ct);
        if (owner.Role != UserRole.Owner) throw new ForbiddenException("Only owners can manage helpers.");

        var helper = await _users.GetByIdAsync(cmd.HelperId, includePermissions: true, ct)
            ?? throw new NotFoundException(nameof(Domain.Entities.User), cmd.HelperId);
        if (helper.Role != UserRole.Helper || helper.OwnerUserId != owner.Id)
            throw new ForbiddenException("Helper does not belong to you.");

        helper.HelperPermissions ??= new HelperPermissions { HelperUserId = helper.Id };
        helper.HelperPermissions.CanAdd = cmd.Permissions.CanAdd;
        helper.HelperPermissions.CanEdit = cmd.Permissions.CanEdit;
        helper.HelperPermissions.CanDelete = cmd.Permissions.CanDelete;
        helper.HelperPermissions.CanSell = cmd.Permissions.CanSell;
        helper.HelperPermissions.CanRecordUse = cmd.Permissions.CanRecordUse;
        helper.UpdatedAt = DateTime.UtcNow;

        // Force re-login so the new permissions take effect on next access token.
        await _refreshTokens.RevokeAllForUserAsync(helper.Id, ct);
        await _uow.SaveChangesAsync(ct);

        return new HelperResponse(
            helper.Id, helper.Username, helper.Email, helper.IsBlocked,
            helper.CreatedAt, helper.LastLoginAt, cmd.Permissions);
    }
}
