using AutoMapper;
using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Features.InventoryItems.Dtos;
using InventoryApp.Application.Services;
using InventoryApp.Domain.Exceptions;
using MediatR;

namespace InventoryApp.Application.Features.InventoryItems.Commands;

public sealed record RecordViewInventoryItemCommand(Guid Id) : IRequest<InventoryItemResponse>;

public class RecordViewHandler : IRequestHandler<RecordViewInventoryItemCommand, InventoryItemResponse>
{
    private readonly IInventoryItemRepository _repo;
    private readonly IInventoryItemService _svc;
    private readonly ICurrentUserContext _current;
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public RecordViewHandler(IInventoryItemRepository repo, IInventoryItemService svc, ICurrentUserContext current,
        IUnitOfWork uow, IMapper mapper)
    {
        _repo = repo; _svc = svc; _current = current; _uow = uow; _mapper = mapper;
    }

    public async Task<InventoryItemResponse> Handle(RecordViewInventoryItemCommand cmd, CancellationToken ct)
    {
        // View counter is harmless; allow any authenticated user with read access (helpers always have read).
        var user = await _current.RequireUserAsync(ct);
        var entity = await _repo.GetByIdAsync(cmd.Id, user.EffectiveOwnerId, ct)
            ?? throw new NotFoundException(nameof(Domain.Entities.InventoryItem), cmd.Id);
        _svc.IncrementView(entity);
        await _uow.SaveChangesAsync(ct);
        return _mapper.Map<InventoryItemResponse>(entity);
    }
}
