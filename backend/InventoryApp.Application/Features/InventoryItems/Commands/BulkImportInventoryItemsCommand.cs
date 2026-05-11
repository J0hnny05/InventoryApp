using AutoMapper;
using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Common;
using InventoryApp.Application.Features.InventoryItems.Dtos;
using InventoryApp.Domain.Entities;
using InventoryApp.Domain.Enums;
using InventoryApp.Domain.Exceptions;
using MediatR;

namespace InventoryApp.Application.Features.InventoryItems.Commands;

public sealed record BulkImportInventoryItemsCommand(IReadOnlyList<InventoryItemImportEntry> Items)
    : IRequest<IReadOnlyList<InventoryItemResponse>>;

public class BulkImportInventoryItemsHandler : IRequestHandler<BulkImportInventoryItemsCommand, IReadOnlyList<InventoryItemResponse>>
{
    private readonly IInventoryItemRepository _repo;
    private readonly ICurrentUserContext _current;
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public BulkImportInventoryItemsHandler(IInventoryItemRepository repo, ICurrentUserContext current,
        IUnitOfWork uow, IMapper mapper)
    {
        _repo = repo;
        _current = current;
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<IReadOnlyList<InventoryItemResponse>> Handle(BulkImportInventoryItemsCommand cmd, CancellationToken ct)
    {
        var user = await _current.RequireUserAsync(ct);
        if (user.Role == UserRole.Helper)
            throw new ForbiddenException("Helpers cannot bulk-import inventory.");
        var ownerId = user.EffectiveOwnerId;

        var entities = _mapper.Map<List<InventoryItem>>(cmd.Items);
        await _repo.ReplaceAllAsync(ownerId, entities, ct);
        await _uow.SaveChangesAsync(ct);
        var (all, _) = await _repo.ListAsync(ownerId, new InventoryItemListQuery(), new PagedQuery(0, PageDefaults.Max), ct);
        return _mapper.Map<List<InventoryItemResponse>>(all);
    }
}
