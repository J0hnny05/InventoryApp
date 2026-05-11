using AutoMapper;
using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Auth;
using InventoryApp.Application.Features.InventoryItems.Dtos;
using InventoryApp.Application.Services;
using InventoryApp.Domain.Exceptions;
using MediatR;

namespace InventoryApp.Application.Features.InventoryItems.Commands;

public sealed record TogglePinInventoryItemCommand(Guid Id) : IRequest<InventoryItemResponse>;

public class TogglePinHandler : IRequestHandler<TogglePinInventoryItemCommand, InventoryItemResponse>
{
    private readonly IInventoryItemRepository _repo;
    private readonly IInventoryItemService _svc;
    private readonly ICurrentUserContext _current;
    private readonly IPermissionGuard _guard;
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public TogglePinHandler(IInventoryItemRepository repo, IInventoryItemService svc, ICurrentUserContext current,
        IPermissionGuard guard, IUnitOfWork uow, IMapper mapper)
    {
        _repo = repo; _svc = svc; _current = current; _guard = guard; _uow = uow; _mapper = mapper;
    }

    public async Task<InventoryItemResponse> Handle(TogglePinInventoryItemCommand cmd, CancellationToken ct)
    {
        await _guard.EnsureCanEditAsync(ct);
        var user = await _current.RequireUserAsync(ct);
        var entity = await _repo.GetByIdAsync(cmd.Id, user.EffectiveOwnerId, ct)
            ?? throw new NotFoundException(nameof(Domain.Entities.InventoryItem), cmd.Id);
        _svc.TogglePin(entity);
        await _uow.SaveChangesAsync(ct);
        return _mapper.Map<InventoryItemResponse>(entity);
    }
}
