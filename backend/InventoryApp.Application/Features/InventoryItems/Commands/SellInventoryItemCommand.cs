using AutoMapper;
using FluentValidation;
using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Auth;
using InventoryApp.Application.Features.InventoryItems.Dtos;
using InventoryApp.Application.Services;
using InventoryApp.Domain.Exceptions;
using MediatR;

namespace InventoryApp.Application.Features.InventoryItems.Commands;

public sealed record SellInventoryItemCommand(Guid Id, decimal SalePrice, DateOnly? SoldAt)
    : IRequest<InventoryItemResponse>;

public class SellInventoryItemValidator : AbstractValidator<SellInventoryItemCommand>
{
    public SellInventoryItemValidator()
    {
        RuleFor(x => x.SalePrice).GreaterThanOrEqualTo(0);
    }
}

public class SellInventoryItemHandler : IRequestHandler<SellInventoryItemCommand, InventoryItemResponse>
{
    private readonly IInventoryItemRepository _repo;
    private readonly IInventoryItemService _svc;
    private readonly ICurrentUserContext _current;
    private readonly IPermissionGuard _guard;
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public SellInventoryItemHandler(IInventoryItemRepository repo, IInventoryItemService svc, ICurrentUserContext current,
        IPermissionGuard guard, IUnitOfWork uow, IMapper mapper)
    {
        _repo = repo; _svc = svc; _current = current; _guard = guard; _uow = uow; _mapper = mapper;
    }

    public async Task<InventoryItemResponse> Handle(SellInventoryItemCommand cmd, CancellationToken ct)
    {
        await _guard.EnsureCanSellAsync(ct);
        var user = await _current.RequireUserAsync(ct);
        var entity = await _repo.GetByIdAsync(cmd.Id, user.EffectiveOwnerId, ct)
            ?? throw new NotFoundException(nameof(Domain.Entities.InventoryItem), cmd.Id);
        var soldAt = cmd.SoldAt ?? DateOnly.FromDateTime(DateTime.UtcNow);
        _svc.MarkSold(entity, cmd.SalePrice, soldAt);
        await _uow.SaveChangesAsync(ct);
        return _mapper.Map<InventoryItemResponse>(entity);
    }
}
