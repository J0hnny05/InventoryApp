using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Auth;
using InventoryApp.Domain.Exceptions;
using MediatR;

namespace InventoryApp.Application.Features.InventoryItems.Commands;

public sealed record DeleteInventoryItemCommand(Guid Id) : IRequest;

public class DeleteInventoryItemHandler : IRequestHandler<DeleteInventoryItemCommand>
{
    private readonly IInventoryItemRepository _repo;
    private readonly ICurrentUserContext _current;
    private readonly IPermissionGuard _guard;
    private readonly IUnitOfWork _uow;

    public DeleteInventoryItemHandler(IInventoryItemRepository repo, ICurrentUserContext current,
        IPermissionGuard guard, IUnitOfWork uow)
    {
        _repo = repo; _current = current; _guard = guard; _uow = uow;
    }

    public async Task Handle(DeleteInventoryItemCommand cmd, CancellationToken ct)
    {
        await _guard.EnsureCanDeleteAsync(ct);
        var user = await _current.RequireUserAsync(ct);
        var entity = await _repo.GetByIdAsync(cmd.Id, user.EffectiveOwnerId, ct)
            ?? throw new NotFoundException(nameof(Domain.Entities.InventoryItem), cmd.Id);
        _repo.Remove(entity);
        await _uow.SaveChangesAsync(ct);
    }
}
