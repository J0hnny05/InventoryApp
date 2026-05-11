using InventoryApp.Application.Common;
using InventoryApp.Application.Features.InventoryItems.Dtos;
using InventoryApp.Domain.Entities;

namespace InventoryApp.Application.Abstractions;

public interface IInventoryItemRepository
{
    Task<InventoryItem?> GetByIdAsync(Guid id, Guid ownerId, CancellationToken ct = default);
    Task<(List<InventoryItem> Items, int Total)> ListAsync(Guid ownerId, InventoryItemListQuery filter, PagedQuery page, CancellationToken ct = default);
    Task AddAsync(InventoryItem item, CancellationToken ct = default);
    void Remove(InventoryItem item);
    Task ReplaceAllAsync(Guid ownerId, IEnumerable<InventoryItem> items, CancellationToken ct = default);

    /// <summary>For statistics queries that need the full set without pagination.</summary>
    Task<List<InventoryItem>> ListAllForOwnerAsync(Guid ownerId, CancellationToken ct = default);
}
