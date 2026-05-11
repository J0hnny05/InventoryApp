using FluentValidation;
using InventoryApp.Application.Abstractions;
using InventoryApp.Domain.Exceptions;
using MediatR;

namespace InventoryApp.Application.Features.Auth.Commands;

public sealed record ChangePasswordCommand(string CurrentPassword, string NewPassword) : IRequest;

public class ChangePasswordValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordValidator()
    {
        RuleFor(x => x.CurrentPassword).NotEmpty();
        RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(6).MaximumLength(128);
    }
}

public class ChangePasswordHandler : IRequestHandler<ChangePasswordCommand>
{
    private readonly ICurrentUserContext _current;
    private readonly IPasswordHasher _hasher;
    private readonly IRefreshTokenRepository _refreshTokens;
    private readonly IUnitOfWork _uow;

    public ChangePasswordHandler(ICurrentUserContext current, IPasswordHasher hasher,
        IRefreshTokenRepository refreshTokens, IUnitOfWork uow)
    {
        _current = current; _hasher = hasher;
        _refreshTokens = refreshTokens; _uow = uow;
    }

    public async Task Handle(ChangePasswordCommand cmd, CancellationToken ct)
    {
        var user = await _current.RequireUserAsync(ct);
        if (!_hasher.Verify(user.PasswordHash, cmd.CurrentPassword))
            throw new UnauthorizedException("Current password is incorrect.");

        user.PasswordHash = _hasher.Hash(cmd.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        // invalidate all refresh tokens for safety
        await _refreshTokens.RevokeAllForUserAsync(user.Id, ct);
        await _uow.SaveChangesAsync(ct);
    }
}
