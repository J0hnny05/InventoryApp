using FluentValidation;
using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Features.Auth.Dtos;
using InventoryApp.Domain.Exceptions;
using MediatR;

namespace InventoryApp.Application.Features.Auth.Commands;

public sealed record RefreshCommand(string RefreshToken) : IRequest<AuthResponse>;

public class RefreshValidator : AbstractValidator<RefreshCommand>
{
    public RefreshValidator() { RuleFor(x => x.RefreshToken).NotEmpty(); }
}

public class RefreshHandler : IRequestHandler<RefreshCommand, AuthResponse>
{
    private readonly IUserRepository _users;
    private readonly IRefreshTokenRepository _refreshTokens;
    private readonly IJwtTokenService _jwt;
    private readonly IUnitOfWork _uow;

    public RefreshHandler(IUserRepository users, IRefreshTokenRepository refreshTokens,
        IJwtTokenService jwt, IUnitOfWork uow)
    {
        _users = users; _refreshTokens = refreshTokens;
        _jwt = jwt; _uow = uow;
    }

    public async Task<AuthResponse> Handle(RefreshCommand cmd, CancellationToken ct)
    {
        var hash = _jwt.HashRefreshToken(cmd.RefreshToken);
        var token = await _refreshTokens.GetByHashAsync(hash, ct);
        if (token is null || !token.IsActive)
            throw new UnauthorizedException("Refresh token is invalid or expired.");

        var user = await _users.GetByIdAsync(token.UserId, includePermissions: true, ct)
            ?? throw new UnauthorizedException("User no longer exists.");
        if (user.IsBlocked) throw new AccountBlockedException();

        var now = DateTime.UtcNow;

        // rotate: issue new refresh, revoke the old one
        var newRefresh = _jwt.IssueRefreshToken(user.Id);
        token.RevokedAt = now;
        token.ReplacedByTokenHash = newRefresh.TokenHash;
        await _refreshTokens.AddAsync(new Domain.Entities.RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = newRefresh.TokenHash,
            CreatedAt = now,
            ExpiresAt = newRefresh.ExpiresAtUtc
        }, ct);

        var access = _jwt.IssueAccessTokenForUser(user, user.HelperPermissions);
        await _uow.SaveChangesAsync(ct);

        return new AuthResponse(
            access.AccessToken, access.ExpiresAtUtc,
            newRefresh.RefreshToken, newRefresh.ExpiresAtUtc,
            AuthMappingHelper.ToAuthUser(user),
            access.Permissions);
    }
}
