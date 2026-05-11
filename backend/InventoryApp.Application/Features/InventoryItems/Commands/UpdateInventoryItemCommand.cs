using AutoMapper;
using FluentValidation;
using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Auth;
using InventoryApp.Application.Features.InventoryItems.Dtos;
using InventoryApp.Application.Services;
using InventoryApp.Domain.Exceptions;
using MediatR;

namespace InventoryApp.Application.Features.InventoryItems.Commands;

public sealed record UpdateInventoryItemCommand(Guid Id, UpdateInventoryItemRequest Data)
    : IRequest<InventoryItemResponse>;

public class UpdateInventoryItemValidator : AbstractValidator<UpdateInventoryItemCommand>
{
    public UpdateInventoryItemValidator()
    {
        RuleFor(x => x.Data.Name).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Data.CategoryId).NotEmpty().MaximumLength(64);
        RuleFor(x => x.Data.PurchasePrice).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Data.Currency).NotEmpty().Length(3);
    }
}

public class UpdateInventoryItemHandler : IRequestHandler<UpdateInventoryItemCommand, InventoryItemResponse>
{
    private readonly IInventoryItemRepository _repo;
    private readonly ICategoryRepository _categories;
    private readonly IInventoryItemService _svc;
    private readonly ICurrentUserContext _current;
    private readonly IPermissionGuard _guard;
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public UpdateInventoryItemHandler(IInventoryItemRepository repo, ICategoryRepository categories,
        IInventoryItemService svc, ICurrentUserContext current, IPermissionGuard guard, IUnitOfWork uow, IMapper mapper)
    {
        _repo = repo; _categories = categories; _svc = svc;
        _current = current; _guard = guard; _uow = uow; _mapper = mapper;
    }

    public async Task<InventoryItemResponse> Handle(UpdateInventoryItemCommand cmd, CancellationToken ct)
    {
        await _guard.EnsureCanEditAsync(ct);
        var user = await _current.RequireUserAsync(ct);
        var ownerId = user.EffectiveOwnerId;

        var entity = await _repo.GetByIdAsync(cmd.Id, ownerId, ct)
            ?? throw new NotFoundException(nameof(Domain.Entities.InventoryItem), cmd.Id);
        if (!await _categories.ExistsForOwnerAsync(cmd.Data.CategoryId, ownerId, ct))
            throw new NotFoundException(nameof(Domain.Entities.Category), cmd.Data.CategoryId);

        _mapper.Map(cmd.Data, entity);
        _svc.Touch(entity);
        await _uow.SaveChangesAsync(ct);
        return _mapper.Map<InventoryItemResponse>(entity);
    }
}
