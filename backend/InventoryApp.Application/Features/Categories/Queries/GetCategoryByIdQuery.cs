using AutoMapper;
using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Features.Categories.Dtos;
using InventoryApp.Domain.Exceptions;
using MediatR;

namespace InventoryApp.Application.Features.Categories.Queries;

public sealed record GetCategoryByIdQuery(string Id) : IRequest<CategoryResponse>;

public class GetCategoryByIdHandler : IRequestHandler<GetCategoryByIdQuery, CategoryResponse>
{
    private readonly ICategoryRepository _repo;
    private readonly ICurrentUserContext _current;
    private readonly IMapper _mapper;

    public GetCategoryByIdHandler(ICategoryRepository repo, ICurrentUserContext current, IMapper mapper)
    {
        _repo = repo; _current = current; _mapper = mapper;
    }

    public async Task<CategoryResponse> Handle(GetCategoryByIdQuery request, CancellationToken ct)
    {
        var user = await _current.RequireUserAsync(ct);
        var c = await _repo.GetByIdForOwnerAsync(request.Id, user.EffectiveOwnerId, ct)
            ?? throw new NotFoundException(nameof(Domain.Entities.Category), request.Id);
        return _mapper.Map<CategoryResponse>(c);
    }
}
