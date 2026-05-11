using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Common;
using InventoryApp.Application.Features.Users.Dtos;
using InventoryApp.Domain.Enums;
using InventoryApp.Domain.Exceptions;
using MediatR;

namespace InventoryApp.Application.Features.Users.Queries;

public sealed record ListAllUsersQuery(int? Skip, int? Take, UserRole? Role) : IRequest<PagedResult<AdminUserListItem>>;

public class ListAllUsersHandler : IRequestHandler<ListAllUsersQuery, PagedResult<AdminUserListItem>>
{
    private readonly IUserRepository _users;
    private readonly ICurrentUserContext _current;

    public ListAllUsersHandler(IUserRepository users, ICurrentUserContext current)
    {
        _users = users; _current = current;
    }

    public async Task<PagedResult<AdminUserListItem>> Handle(ListAllUsersQuery q, CancellationToken ct)
    {
        var user = await _current.RequireUserAsync(ct);
        if (user.Role != UserRole.Admin) throw new ForbiddenException("Admins only.");

        var page = new PagedQuery(q.Skip, q.Take);
        var (items, total) = await _users.ListAllAsync(page, q.Role, ct);
        var mapped = items.Select(u => new AdminUserListItem(
            u.Id, u.Username, u.Email, u.Role, u.OwnerUserId, u.IsBlocked, u.CreatedAt, u.LastLoginAt)).ToList();
        return new PagedResult<AdminUserListItem>(mapped, total, page.Skip, page.Take);
    }
}
