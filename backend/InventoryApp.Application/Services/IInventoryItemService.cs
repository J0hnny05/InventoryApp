using InventoryApp.Domain.Entities;

namespace InventoryApp.Application.Services;

public interface IInventoryItemService
{
    void TogglePin(InventoryItem item);
    void MarkSold(InventoryItem item, decimal salePrice, DateOnly soldAt);
    void IncrementUse(InventoryItem item);
    void IncrementView(InventoryItem item);
    void Touch(InventoryItem item);
}
