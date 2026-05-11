using AutoMapper;
using FluentValidation;
using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Auth;
using InventoryApp.Application.Features.InventoryItems.Dtos;
using InventoryApp.Domain.Entities;
using InventoryApp.Domain.Enums;
using InventoryApp.Domain.Exceptions;
using MediatR;

namespace InventoryApp.Application.Features.InventoryItems.Commands;

public sealed record CreateInventoryItemCommand(CreateInventoryItemRequest Data) : IRequest<InventoryItemResponse>;

public class CreateInventoryItemValidator : AbstractValidator<CreateInventoryItemCommand>
{
    public CreateInventoryItemValidator()
    {
        RuleFor(x => x.Data.Name).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Data.CategoryId).NotEmpty().MaximumLength(64);
        RuleFor(x => x.Data.PurchasePrice).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Data.Currency).NotEmpty().Length(3);
        RuleFor(x => x.Data.Brand).MaximumLength(120);
        RuleFor(x => x.Data.Location).MaximumLength(120);
    }
}

public class CreateInventoryItemHandler : IRequestHandler<CreateInventoryItemCommand, InventoryItemResponse>
{
    private readonly IInventoryItemRepository _repo;
    private readonly ICategoryRepository _categories;
    private readonly ICurrentUserContext _current;
    private readonly IPermissionGuard _guard;
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public CreateInventoryItemHandler(IInventoryItemRepository repo, ICategoryRepository categories,
        ICurrentUserContext current, IPermissionGuard guard, IUnitOfWork uow, IMapper mapper)
    {
        _repo = repo; _categories = categories;
        _current = current; _guard = guard;
        _uow = uow; _mapper = mapper;
    }

    public async Task<InventoryItemResponse> Handle(CreateInventoryItemCommand cmd, CancellationToken ct)
    {
        await _guard.EnsureCanAddAsync(ct);
        var user = await _current.RequireUserAsync(ct);
        var ownerId = user.EffectiveOwnerId;

        if (!await _categories.ExistsForOwnerAsync(cmd.Data.CategoryId, ownerId, ct))
            throw new NotFoundException(nameof(Domain.Entities.Category), cmd.Data.CategoryId);

        var entity = _mapper.Map<InventoryItem>(cmd.Data);
        entity.Id = Guid.NewGuid();
        entity.OwnerUserId = ownerId;
        entity.Status = ItemStatus.Owned;
        entity.Pinned = false;
        entity.UseCount = 0;
        entity.ViewCount = 0;
        entity.CreatedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;

        await _repo.AddAsync(entity, ct);
        await _uow.SaveChangesAsync(ct);
        return _mapper.Map<InventoryItemResponse>(entity);
    }
}
