using AutoMapper;
using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Common;
using InventoryApp.Application.Features.InventoryItems.Dtos;
using InventoryApp.Domain.Enums;
using MediatR;

namespace InventoryApp.Application.Features.InventoryItems.Queries;

public sealed record ListInventoryItemsRequest(
    string? Search, string? CategoryId, ItemStatus? Status, InventorySort? Sort,
    int? Skip = null, int? Take = null)
    : IRequest<PagedResult<InventoryItemResponse>>;

public class ListInventoryItemsHandler : IRequestHandler<ListInventoryItemsRequest, PagedResult<InventoryItemResponse>>
{
    private readonly IInventoryItemRepository _repo;
    private readonly ICurrentUserContext _current;
    private readonly IMapper _mapper;

    public ListInventoryItemsHandler(IInventoryItemRepository repo, ICurrentUserContext current, IMapper mapper)
    {
        _repo = repo;
        _current = current;
        _mapper = mapper;
    }

    public async Task<PagedResult<InventoryItemResponse>> Handle(ListInventoryItemsRequest req, CancellationToken ct)
    {
        var user = await _current.RequireUserAsync(ct);
        var page = new PagedQuery(req.Skip, req.Take);
        var filter = new InventoryItemListQuery(req.Search, req.CategoryId, req.Status, req.Sort);
        var (items, total) = await _repo.ListAsync(user.EffectiveOwnerId, filter, page, ct);
        var mapped = _mapper.Map<List<InventoryItemResponse>>(items);
        return new PagedResult<InventoryItemResponse>(mapped, total, page.Skip, page.Take);
    }
}
