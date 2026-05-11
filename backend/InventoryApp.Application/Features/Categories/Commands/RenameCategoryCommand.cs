using AutoMapper;
using FluentValidation;
using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Features.Categories.Dtos;
using InventoryApp.Application.Services;
using InventoryApp.Domain.Enums;
using InventoryApp.Domain.Exceptions;
using MediatR;

namespace InventoryApp.Application.Features.Categories.Commands;

public sealed record RenameCategoryCommand(string Id, string Name) : IRequest<CategoryResponse>;

public class RenameCategoryValidator : AbstractValidator<RenameCategoryCommand>
{
    public RenameCategoryValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(80);
    }
}

public class RenameCategoryHandler : IRequestHandler<RenameCategoryCommand, CategoryResponse>
{
    private readonly ICategoryRepository _repo;
    private readonly ICategoryService _svc;
    private readonly ICurrentUserContext _current;
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public RenameCategoryHandler(ICategoryRepository repo, ICategoryService svc, ICurrentUserContext current, IUnitOfWork uow, IMapper mapper)
    {
        _repo = repo;
        _svc = svc;
        _current = current;
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<CategoryResponse> Handle(RenameCategoryCommand cmd, CancellationToken ct)
    {
        var user = await _current.RequireUserAsync(ct);
        if (user.Role == UserRole.Helper) throw new ForbiddenException("Helpers cannot manage categories.");

        var ownerId = user.EffectiveOwnerId;
        var c = await _repo.GetByIdForOwnerAsync(cmd.Id, ownerId, ct)
            ?? throw new NotFoundException(nameof(Domain.Entities.Category), cmd.Id);
        var newName = cmd.Name.Trim();
        if (await _repo.NameExistsForOwnerAsync(newName, ownerId, cmd.Id, ct))
            throw new Domain.Exceptions.DomainException($"Category '{newName}' already exists.");
        _svc.Rename(c, newName);
        await _uow.SaveChangesAsync(ct);
        return _mapper.Map<CategoryResponse>(c);
    }
}
