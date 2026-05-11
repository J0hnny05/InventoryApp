using InventoryApp.Application.Abstractions;
using InventoryApp.Domain.Enums;
using InventoryApp.Domain.Exceptions;
using MediatR;

namespace InventoryApp.Application.Features.Users.Commands;

public sealed record DeleteHelperCommand(Guid HelperId) : IRequest;

public class DeleteHelperHandler : IRequestHandler<DeleteHelperCommand>
{
    private readonly IUserRepository _users;
    private readonly ICurrentUserContext _current;
    private readonly IUnitOfWork _uow;

    public DeleteHelperHandler(IUserRepository users, ICurrentUserContext current, IUnitOfWork uow)
    {
        _users = users; _current = current; _uow = uow;
    }

    public async Task Handle(DeleteHelperCommand cmd, CancellationToken ct)
    {
        var owner = await _current.RequireUserAsync(ct);
        if (owner.Role != UserRole.Owner) throw new ForbiddenException("Only owners can manage helpers.");

        var helper = await _users.GetByIdAsync(cmd.HelperId, includePermissions: false, ct)
            ?? throw new NotFoundException(nameof(Domain.Entities.User), cmd.HelperId);
        if (helper.Role != UserRole.Helper || helper.OwnerUserId != owner.Id)
            throw new ForbiddenException("Helper does not belong to you.");

        _users.Remove(helper);
        await _uow.SaveChangesAsync(ct);
    }
}
