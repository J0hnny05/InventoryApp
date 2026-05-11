using FluentValidation;
using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Features.Auth.Dtos;
using InventoryApp.Domain.Entities;
using InventoryApp.Domain.Enums;
using MediatR;

namespace InventoryApp.Application.Features.Auth.Commands;

public sealed record RegisterCommand(string Username, string Password, string? Email) : IRequest<AuthResponse>;

public class RegisterValidator : AbstractValidator<RegisterCommand>
{
    public RegisterValidator()
    {
        RuleFor(x => x.Username).NotEmpty().MinimumLength(3).MaximumLength(64).Matches("^[a-zA-Z0-9_.-]+$")
            .WithMessage("Username may contain letters, digits, '_', '.', '-' only.");
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6).MaximumLength(128);
        RuleFor(x => x.Email).MaximumLength(254).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email));
    }
}

public class RegisterHandler : IRequestHandler<RegisterCommand, AuthResponse>
{
    private readonly IUserRepository _users;
    private readonly IRefreshTokenRepository _refreshTokens;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenService _jwt;
    private readonly IUnitOfWork _uow;

    public RegisterHandler(IUserRepository users, IRefreshTokenRepository refreshTokens,
        IPasswordHasher hasher, IJwtTokenService jwt, IUnitOfWork uow)
    {
        _users = users; _refreshTokens = refreshTokens;
        _hasher = hasher; _jwt = jwt; _uow = uow;
    }

    public async Task<AuthResponse> Handle(RegisterCommand cmd, CancellationToken ct)
    {
        if (await _users.UsernameExistsAsync(cmd.Username, ct))
            throw new Domain.Exceptions.DomainException($"Username '{cmd.Username}' is already taken.");

        var now = DateTime.UtcNow;
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = cmd.Username.Trim(),
            Email = string.IsNullOrWhiteSpace(cmd.Email) ? null : cmd.Email.Trim(),
            PasswordHash = _hasher.Hash(cmd.Password),
            Role = UserRole.Owner,
            OwnerUserId = null,
            IsBlocked = false,
            CreatedAt = now,
            UpdatedAt = now,
            LastLoginAt = now
        };
        await _users.AddAsync(user, ct);

        var access = _jwt.IssueAccessTokenForUser(user, null);
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
