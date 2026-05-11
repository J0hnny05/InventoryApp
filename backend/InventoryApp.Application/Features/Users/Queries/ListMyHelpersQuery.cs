using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Common;
using InventoryApp.Application.Features.Auth.Dtos;
using InventoryApp.Application.Features.Users.Dtos;
using InventoryApp.Domain.Entities;
using InventoryApp.Domain.Enums;
using InventoryApp.Domain.Exceptions;
using MediatR;

namespace InventoryApp.Application.Features.Users.Queries;

public sealed record ListMyHelpersQuery(int? Skip, int? Take) : IRequest<PagedResult<HelperResponse>>;

public class ListMyHelpersHandler : IRequestHandler<ListMyHelpersQuery, PagedResult<HelperResponse>>
{
    private readonly IUserRepository _users;
    private readonly ICurrentUserContext _current;

    public ListMyHelpersHandler(IUserRepository users, ICurrentUserContext current)
    {
        _users = users; _current = current;
    }

    public async Task<PagedResult<HelperResponse>> Handle(ListMyHelpersQuery q, CancellationToken ct)
    {
        var user = await _current.RequireUserAsync(ct);
        if (user.Role != UserRole.Owner) throw new ForbiddenException("Only owners can manage helpers.");

        var page = new PagedQuery(q.Skip, q.Take);
        var (items, total) = await _users.ListHelpersAsync(user.Id, page, ct);
        var mapped = items.Select(ToHelperResponse).ToList();
        return new PagedResult<HelperResponse>(mapped, total, page.Skip, page.Take);
    }

    private static HelperResponse ToHelperResponse(User u) => new(
        u.Id, u.Username, u.Email, u.IsBlocked, u.CreatedAt, u.LastLoginAt,
        new HelperPermissionsDto(
            u.HelperPermissions?.CanAdd ?? false,
            u.HelperPermissions?.CanEdit ?? false,
            u.HelperPermissions?.CanDelete ?? false,
            u.HelperPermissions?.CanSell ?? false,
            u.HelperPermissions?.CanRecordUse ?? false));
}
