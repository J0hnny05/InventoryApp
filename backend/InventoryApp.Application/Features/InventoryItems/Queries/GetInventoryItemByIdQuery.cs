using AutoMapper;
using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Features.InventoryItems.Dtos;
using InventoryApp.Domain.Exceptions;
using MediatR;

namespace InventoryApp.Application.Features.InventoryItems.Queries;

public sealed record GetInventoryItemByIdQuery(Guid Id) : IRequest<InventoryItemResponse>;

public class GetInventoryItemByIdHandler : IRequestHandler<GetInventoryItemByIdQuery, InventoryItemResponse>
{
    private readonly IInventoryItemRepository _repo;
    private readonly ICurrentUserContext _current;
    private readonly IMapper _mapper;

    public GetInventoryItemByIdHandler(IInventoryItemRepository repo, ICurrentUserContext current, IMapper mapper)
    {
        _repo = repo;
        _current = current;
        _mapper = mapper;
    }

    public async Task<InventoryItemResponse> Handle(GetInventoryItemByIdQuery q, CancellationToken ct)
    {
        var user = await _current.RequireUserAsync(ct);
        var i = await _repo.GetByIdAsync(q.Id, user.EffectiveOwnerId, ct)
            ?? throw new NotFoundException(nameof(Domain.Entities.InventoryItem), q.Id);
        return _mapper.Map<InventoryItemResponse>(i);
    }
}
