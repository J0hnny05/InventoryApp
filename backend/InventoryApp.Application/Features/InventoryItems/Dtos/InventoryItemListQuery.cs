using InventoryApp.Domain.Enums;

namespace InventoryApp.Application.Features.InventoryItems.Dtos;

public sealed record InventoryItemListQuery(
    string? Search = null,
    string? CategoryId = null,
    ItemStatus? Status = null,
    InventorySort? Sort = null);
