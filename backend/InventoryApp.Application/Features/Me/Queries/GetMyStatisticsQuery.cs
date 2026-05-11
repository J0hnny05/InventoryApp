using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Features.Me.Dtos;
using InventoryApp.Domain.Common;
using InventoryApp.Domain.Enums;
using MediatR;

namespace InventoryApp.Application.Features.Me.Queries;

public sealed record GetMyStatisticsQuery : IRequest<MyStatisticsResponse>;

public class GetMyStatisticsHandler : IRequestHandler<GetMyStatisticsQuery, MyStatisticsResponse>
{
    private readonly IInventoryItemRepository _items;
    private readonly ICurrentUserContext _current;

    public GetMyStatisticsHandler(IInventoryItemRepository items, ICurrentUserContext current)
    {
        _items = items; _current = current;
    }

    public async Task<MyStatisticsResponse> Handle(GetMyStatisticsQuery request, CancellationToken ct)
    {
        var user = await _current.RequireUserAsync(ct);
        var ownerId = user.EffectiveOwnerId;
        var all = await _items.ListAllForOwnerAsync(ownerId, ct);

        var owned = all.Where(i => i.Status == ItemStatus.Owned).ToList();
        var sold = all.Where(i => i.Status == ItemStatus.Sold).ToList();

        var ownedValue = owned
            .GroupBy(i => i.Currency)
            .Select(g => new CurrencyAmount(g.Key, g.Sum(i => i.PurchasePrice)))
            .OrderByDescending(c => c.Amount)
            .ToList();

        var realized = sold
            .GroupBy(i => i.Currency)
            .Select(g => new CurrencyAmount(g.Key, g.Sum(ItemComputations.Profit)))
            .OrderByDescending(c => Math.Abs(c.Amount))
            .ToList();

        var recentItems = all
            .OrderByDescending(i => i.CreatedAt)
            .Take(5)
            .Select(i => new RecentItemSummary(i.Id, i.Name, i.Currency, i.PurchasePrice, i.CreatedAt))
            .ToList();

        var recentSales = sold
            .Where(i => i.SoldAt.HasValue)
            .OrderByDescending(i => i.SoldAt!.Value)
            .Take(5)
            .Select(i => new RecentSaleSummary(i.Id, i.Name, i.Currency, ItemComputations.Profit(i), i.SoldAt!.Value))
            .ToList();

        return new MyStatisticsResponse(
            user.Username,
            user.Role.ToString(),
            owned.Count,
            sold.Count,
            owned.Count(i => i.Pinned),
            all.Sum(i => i.UseCount),
            all.Sum(i => i.ViewCount),
            ownedValue,
            realized,
            recentItems,
            recentSales,
            user.LastLoginAt,
            user.CreatedAt);
    }
}
