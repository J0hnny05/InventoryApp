using InventoryApp.Domain.Enums;

namespace InventoryApp.Domain.Entities;

public class InventoryItem
{
    public Guid Id { get; set; }
    public Guid OwnerUserId { get; set; }
    public string Name { get; set; } = default!;
    public string CategoryId { get; set; } = default!;
    public decimal PurchasePrice { get; set; }
    public DateOnly PurchaseDate { get; set; }
    public string Currency { get; set; } = default!;
    public string? Description { get; set; }
    public string? Brand { get; set; }
    public ItemCondition? Condition { get; set; }
    public string? Location { get; set; }
    public List<string> Tags { get; set; } = new();
    public bool Pinned { get; set; }
    public ItemStatus Status { get; set; } = ItemStatus.Owned;
    public DateOnly? SoldAt { get; set; }
    public decimal? SalePrice { get; set; }
    public int UseCount { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public int ViewCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Category? Category { get; set; }
}
