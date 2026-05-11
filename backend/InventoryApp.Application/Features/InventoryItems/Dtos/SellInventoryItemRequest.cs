namespace InventoryApp.Application.Features.InventoryItems.Dtos;

public sealed record SellInventoryItemRequest(decimal SalePrice, DateOnly? SoldAt = null);
