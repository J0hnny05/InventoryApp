using AutoMapper;
using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Common;
using InventoryApp.Application.Features.Categories.Dtos;
using MediatR;

namespace InventoryApp.Application.Features.Categories.Queries;

public sealed record ListCategoriesQuery(int? Skip = null, int? Take = null) : IRequest<PagedResult<CategoryResponse>>;

public class ListCategoriesHandler : IRequestHandler<ListCategoriesQuery, PagedResult<CategoryResponse>>
{
    private readonly ICategoryRepository _repo;
    private readonly ICurrentUserContext _current;
    private readonly IMapper _mapper;

    public ListCategoriesHandler(ICategoryRepository repo, ICurrentUserContext current, IMapper mapper)
    {
        _repo = repo;
        _current = current;
        _mapper = mapper;
    }

    public async Task<PagedResult<CategoryResponse>> Handle(ListCategoriesQuery q, CancellationToken ct)
    {
        var user = await _current.RequireUserAsync(ct);
        var page = new PagedQuery(q.Skip, q.Take);
        var (items, total) = await _repo.ListForOwnerAsync(user.EffectiveOwnerId, page, ct);
        var mapped = _mapper.Map<List<CategoryResponse>>(items);
        return new PagedResult<CategoryResponse>(mapped, total, page.Skip, page.Take);
    }
}
