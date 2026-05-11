using InventoryApp.Domain.Entities;
using InventoryApp.Domain.Enums;

namespace InventoryApp.Domain.Common;

public static class ItemComputations
{
    public static decimal Profit(InventoryItem item)
    {
        if (item.Status != ItemStatus.Sold || item.SalePrice is null) return 0m;
        return item.SalePrice.Value - item.PurchasePrice;
    }

    public static decimal Roi(InventoryItem item)
    {
        if (item.Status != ItemStatus.Sold || item.SalePrice is null || item.PurchasePrice == 0m)
            return 0m;
        return (item.SalePrice.Value - item.PurchasePrice) / item.PurchasePrice * 100m;
    }

    public static int DaysOwned(InventoryItem item, DateTime utcNow)
    {
        var start = item.PurchaseDate.ToDateTime(TimeOnly.MinValue);
        var end = item.Status == ItemStatus.Sold && item.SoldAt.HasValue
            ? item.SoldAt.Value.ToDateTime(TimeOnly.MinValue)
            : DateOnly.FromDateTime(utcNow).ToDateTime(TimeOnly.MinValue);
        var span = end - start;
        return Math.Max(0, (int)Math.Floor(span.TotalDays));
    }
}
