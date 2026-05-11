using FluentValidation;
using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Features.Auth.Dtos;
using InventoryApp.Application.Features.Users.Dtos;
using InventoryApp.Domain.Entities;
using InventoryApp.Domain.Enums;
using InventoryApp.Domain.Exceptions;
using MediatR;

namespace InventoryApp.Application.Features.Users.Commands;

public sealed record CreateHelperCommand(string Username, string Password, string? Email,
    HelperPermissionsDto Permissions) : IRequest<HelperResponse>;

public class CreateHelperValidator : AbstractValidator<CreateHelperCommand>
{
    public CreateHelperValidator()
    {
        RuleFor(x => x.Username).NotEmpty().MinimumLength(3).MaximumLength(64).Matches("^[a-zA-Z0-9_.-]+$");
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6).MaximumLength(128);
        RuleFor(x => x.Email).MaximumLength(254).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email));
    }
}

public class CreateHelperHandler : IRequestHandler<CreateHelperCommand, HelperResponse>
{
    private readonly IUserRepository _users;
    private readonly ICurrentUserContext _current;
    private readonly IPasswordHasher _hasher;
    private readonly IUnitOfWork _uow;

    public CreateHelperHandler(IUserRepository users, ICurrentUserContext current,
        IPasswordHasher hasher, IUnitOfWork uow)
    {
        _users = users; _current = current; _hasher = hasher; _uow = uow;
    }

    public async Task<HelperResponse> Handle(CreateHelperCommand cmd, CancellationToken ct)
    {
        var owner = await _current.RequireUserAsync(ct);
        if (owner.Role != UserRole.Owner) throw new ForbiddenException("Only owners can create helpers.");
        if (await _users.UsernameExistsAsync(cmd.Username, ct))
            throw new Domain.Exceptions.DomainException($"Username '{cmd.Username}' is already taken.");

        var now = DateTime.UtcNow;
        var helper = new User
        {
            Id = Guid.NewGuid(),
            Username = cmd.Username.Trim(),
            Email = string.IsNullOrWhiteSpace(cmd.Email) ? null : cmd.Email.Trim(),
            PasswordHash = _hasher.Hash(cmd.Password),
            Role = UserRole.Helper,
            OwnerUserId = owner.Id,
            IsBlocked = false,
            CreatedAt = now,
            UpdatedAt = now,
            HelperPermissions = new HelperPermissions
            {
                CanAdd = cmd.Permissions.CanAdd,
                CanEdit = cmd.Permissions.CanEdit,
                CanDelete = cmd.Permissions.CanDelete,
                CanSell = cmd.Permissions.CanSell,
                CanRecordUse = cmd.Permissions.CanRecordUse
            }
        };
        helper.HelperPermissions.HelperUserId = helper.Id;
        await _users.AddAsync(helper, ct);
        await _uow.SaveChangesAsync(ct);

        return new HelperResponse(
            helper.Id, helper.Username, helper.Email, helper.IsBlocked,
            helper.CreatedAt, helper.LastLoginAt,
            cmd.Permissions);
    }
}
