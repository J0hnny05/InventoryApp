using InventoryApp.Application.Abstractions;
using InventoryApp.Domain.Enums;
using InventoryApp.Domain.Exceptions;
using MediatR;

namespace InventoryApp.Application.Features.Users.Commands;

public sealed record BlockUserCommand(Guid UserId, bool Block) : IRequest;

public class BlockUserHandler : IRequestHandler<BlockUserCommand>
{
    private readonly IUserRepository _users;
    private readonly ICurrentUserContext _current;
    private readonly IRefreshTokenRepository _refreshTokens;
    private readonly IUnitOfWork _uow;

    public BlockUserHandler(IUserRepository users, ICurrentUserContext current,
        IRefreshTokenRepository refreshTokens, IUnitOfWork uow)
    {
        _users = users; _current = current;
        _refreshTokens = refreshTokens; _uow = uow;
    }

    public async Task Handle(BlockUserCommand cmd, CancellationToken ct)
    {
        var actor = await _current.RequireUserAsync(ct);
        if (actor.Role != UserRole.Admin) throw new ForbiddenException("Admins only.");
        if (actor.Id == cmd.UserId) throw new Domain.Exceptions.DomainException("You cannot block your own account.");

        var target = await _users.GetByIdAsync(cmd.UserId, includePermissions: false, ct)
            ?? throw new NotFoundException(nameof(Domain.Entities.User), cmd.UserId);
        if (target.Role == UserRole.Admin) throw new ForbiddenException("Admins cannot block other admins.");

        target.IsBlocked = cmd.Block;
        target.UpdatedAt = DateTime.UtcNow;
        if (cmd.Block) await _refreshTokens.RevokeAllForUserAsync(target.Id, ct);
        await _uow.SaveChangesAsync(ct);
    }
}
