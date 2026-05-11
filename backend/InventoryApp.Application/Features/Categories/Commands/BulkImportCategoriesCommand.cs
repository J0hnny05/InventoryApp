using AutoMapper;
using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Common;
using InventoryApp.Application.Features.Categories.Dtos;
using InventoryApp.Domain.Entities;
using InventoryApp.Domain.Enums;
using InventoryApp.Domain.Exceptions;
using MediatR;

namespace InventoryApp.Application.Features.Categories.Commands;

public sealed record BulkImportCategoriesCommand(IReadOnlyList<CategoryImportEntry> Categories)
    : IRequest<IReadOnlyList<CategoryResponse>>;

public class BulkImportCategoriesHandler : IRequestHandler<BulkImportCategoriesCommand, IReadOnlyList<CategoryResponse>>
{
    private readonly ICategoryRepository _repo;
    private readonly ICurrentUserContext _current;
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public BulkImportCategoriesHandler(ICategoryRepository repo, ICurrentUserContext current, IUnitOfWork uow, IMapper mapper)
    {
        _repo = repo;
        _current = current;
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<IReadOnlyList<CategoryResponse>> Handle(BulkImportCategoriesCommand cmd, CancellationToken ct)
    {
        var user = await _current.RequireUserAsync(ct);
        if (user.Role == UserRole.Helper) throw new ForbiddenException("Helpers cannot manage categories.");

        var ownerId = user.EffectiveOwnerId;
        var entities = _mapper.Map<List<Category>>(cmd.Categories);
        foreach (var c in entities) c.BuiltIn = false; // imported user-defined categories
        await _repo.ReplaceUserDefinedForOwnerAsync(ownerId, entities, ct);
        await _uow.SaveChangesAsync(ct);
        var (all, _) = await _repo.ListForOwnerAsync(ownerId, new PagedQuery(0, PageDefaults.Max), ct);
        return _mapper.Map<List<CategoryResponse>>(all);
    }
}
