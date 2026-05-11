using FluentValidation;
using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Features.Auth.Dtos;
using InventoryApp.Domain.Exceptions;
using MediatR;

namespace InventoryApp.Application.Features.Auth.Commands;

public sealed record LoginCommand(string Username, string Password) : IRequest<AuthResponse>;

public class LoginValidator : AbstractValidator<LoginCommand>
{
    public LoginValidator()
    {
        RuleFor(x => x.Username).NotEmpty();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class LoginHandler : IRequestHandler<LoginCommand, AuthResponse>
{
    private readonly IUserRepository _users;
    private readonly IRefreshTokenRepository _refreshTokens;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenService _jwt;
    private readonly IUnitOfWork _uow;

    public LoginHandler(IUserRepository users, IRefreshTokenRepository refreshTokens,
        IPasswordHasher hasher, IJwtTokenService jwt, IUnitOfWork uow)
    {
        _users = users; _refreshTokens = refreshTokens;
        _hasher = hasher; _jwt = jwt; _uow = uow;
    }

    public async Task<AuthResponse> Handle(LoginCommand cmd, CancellationToken ct)
    {
        var user = await _users.GetByUsernameAsync(cmd.Username, includePermissions: true, ct);
        if (user is null || !_hasher.Verify(user.PasswordHash, cmd.Password))
            throw new UnauthorizedException("Invalid username or password.");
        if (user.IsBlocked) throw new AccountBlockedException();

        var now = DateTime.UtcNow;
        user.LastLoginAt = now;
        user.UpdatedAt = now;

        var access = _jwt.IssueAccessTokenForUser(user, user.HelperPermissions);
        var refresh = _jwt.IssueRefreshToken(user.Id);
        await _refreshTokens.AddAsync(new Domain.Entities.RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = refresh.TokenHash,
            CreatedAt = now,
            ExpiresAt = refresh.ExpiresAtUtc
        }, ct);

        await _uow.SaveChangesAsync(ct);

        return new AuthResponse(
            access.AccessToken, access.ExpiresAtUtc,
            refresh.RefreshToken, refresh.ExpiresAtUtc,
            AuthMappingHelper.ToAuthUser(user),
            access.Permissions);
    }
}
