using InventoryApp.Application.Abstractions;
using MediatR;

namespace InventoryApp.Application.Features.Auth.Commands;

/// <summary>Revokes all active refresh tokens for the current user.</summary>
public sealed record LogoutCommand : IRequest;

public class LogoutHandler : IRequestHandler<LogoutCommand>
{
    private readonly ICurrentUserContext _current;
    private readonly IRefreshTokenRepository _refreshTokens;
    private readonly IUnitOfWork _uow;

    public LogoutHandler(ICurrentUserContext current, IRefreshTokenRepository refreshTokens, IUnitOfWork uow)
    {
        _current = current; _refreshTokens = refreshTokens; _uow = uow;
    }

    public async Task Handle(LogoutCommand request, CancellationToken ct)
    {
        if (_current.UserId is not Guid id) return;
        await _refreshTokens.RevokeAllForUserAsync(id, ct);
        await _uow.SaveChangesAsync(ct);
    }
}
