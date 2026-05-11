using InventoryApp.Application.Abstractions;
using InventoryApp.Domain.Enums;
using InventoryApp.Domain.Exceptions;
using MediatR;

namespace InventoryApp.Application.Features.Users.Commands;

public sealed record AdminDeleteUserCommand(Guid UserId) : IRequest;

public class AdminDeleteUserHandler : IRequestHandler<AdminDeleteUserCommand>
{
    private readonly IUserRepository _users;
    private readonly ICurrentUserContext _current;
    private readonly IUnitOfWork _uow;

    public AdminDeleteUserHandler(IUserRepository users, ICurrentUserContext current, IUnitOfWork uow)
    {
        _users = users; _current = current; _uow = uow;
    }

    public async Task Handle(AdminDeleteUserCommand cmd, CancellationToken ct)
    {
        var actor = await _current.RequireUserAsync(ct);
        if (actor.Role != UserRole.Admin) throw new ForbiddenException("Admins only.");
        if (actor.Id == cmd.UserId) throw new Domain.Exceptions.DomainException("You cannot delete your own account.");

        var target = await _users.GetByIdAsync(cmd.UserId, includePermissions: false, ct)
            ?? throw new NotFoundException(nameof(Domain.Entities.User), cmd.UserId);
        if (target.Role == UserRole.Admin) throw new ForbiddenException("Admins cannot delete other admins.");

        _users.Remove(target);
        await _uow.SaveChangesAsync(ct);
    }
}
