using InventoryApp.Domain.Entities;
using InventoryApp.Domain.Enums;
using InventoryApp.Domain.Exceptions;

namespace InventoryApp.Application.Services;

public class InventoryItemService : IInventoryItemService
{
    public void TogglePin(InventoryItem item)
    {
        item.Pinned = !item.Pinned;
        item.UpdatedAt = DateTime.UtcNow;
    }

    public void MarkSold(InventoryItem item, decimal salePrice, DateOnly soldAt)
    {
        if (item.Status == ItemStatus.Sold)
            throw new DomainException("Item is already sold.");
        if (salePrice < 0m)
            throw new DomainException("Sale price must be non-negative.");
        if (soldAt < item.PurchaseDate)
            throw new DomainException("Sold date cannot precede purchase date.");

        item.Status = ItemStatus.Sold;
        item.SalePrice = salePrice;
        item.SoldAt = soldAt;
        item.UpdatedAt = DateTime.UtcNow;
    }

    public void IncrementUse(InventoryItem item)
    {
        item.UseCount += 1;
        item.LastUsedAt = DateTime.UtcNow;
        item.UpdatedAt = DateTime.UtcNow;
    }

    public void IncrementView(InventoryItem item)
    {
        item.ViewCount += 1;
    }

    public void Touch(InventoryItem item) => item.UpdatedAt = DateTime.UtcNow;
}
