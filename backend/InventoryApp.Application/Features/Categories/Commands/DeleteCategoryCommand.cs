using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Services;
using InventoryApp.Domain.Enums;
using InventoryApp.Domain.Exceptions;
using MediatR;

namespace InventoryApp.Application.Features.Categories.Commands;

public sealed record DeleteCategoryCommand(string Id) : IRequest;

public class DeleteCategoryHandler : IRequestHandler<DeleteCategoryCommand>
{
    private readonly ICategoryRepository _repo;
    private readonly ICategoryService _svc;
    private readonly ICurrentUserContext _current;
    private readonly IUnitOfWork _uow;

    public DeleteCategoryHandler(ICategoryRepository repo, ICategoryService svc, ICurrentUserContext current, IUnitOfWork uow)
    {
        _repo = repo;
        _svc = svc;
        _current = current;
        _uow = uow;
    }

    public async Task Handle(DeleteCategoryCommand cmd, CancellationToken ct)
    {
        var user = await _current.RequireUserAsync(ct);
        if (user.Role == UserRole.Helper) throw new ForbiddenException("Helpers cannot manage categories.");

        var ownerId = user.EffectiveOwnerId;
        var c = await _repo.GetByIdForOwnerAsync(cmd.Id, ownerId, ct)
            ?? throw new NotFoundException(nameof(Domain.Entities.Category), cmd.Id);
        _svc.EnsureDeletable(c);
        if (await _repo.AnyItemsUseCategoryAsync(cmd.Id, ownerId, ct))
            throw new Domain.Exceptions.DomainException($"Category '{cmd.Id}' is in use by inventory items.");
        _repo.Remove(c);
        await _uow.SaveChangesAsync(ct);
    }
}
