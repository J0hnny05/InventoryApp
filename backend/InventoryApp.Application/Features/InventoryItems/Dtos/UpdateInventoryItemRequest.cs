using InventoryApp.Domain.Enums;

namespace InventoryApp.Application.Features.InventoryItems.Dtos;

public sealed record UpdateInventoryItemRequest(
    string Name,
    string CategoryId,
    decimal PurchasePrice,
    DateOnly PurchaseDate,
    string Currency,
    string? Description = null,
    string? Brand = null,
    ItemCondition? Condition = null,
    string? Location = null,
    IReadOnlyList<string>? Tags = null);
