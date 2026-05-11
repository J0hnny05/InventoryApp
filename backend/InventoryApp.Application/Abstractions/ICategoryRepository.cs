using InventoryApp.Application.Common;
using InventoryApp.Domain.Entities;

namespace InventoryApp.Application.Abstractions;

public interface ICategoryRepository
{
    /// <summary>Returns the category if it is global (built-in) OR owned by the specified user.</summary>
    Task<Category?> GetByIdForOwnerAsync(string id, Guid ownerId, CancellationToken ct = default);

    /// <summary>Lists built-in categories merged with the owner's user-defined categories.</summary>
    Task<(List<Category> Items, int Total)> ListForOwnerAsync(Guid ownerId, PagedQuery page, CancellationToken ct = default);

    Task<bool> ExistsForOwnerAsync(string id, Guid ownerId, CancellationToken ct = default);
    Task<bool> NameExistsForOwnerAsync(string name, Guid ownerId, string? excludeId = null, CancellationToken ct = default);
    Task AddAsync(Category category, CancellationToken ct = default);
    void Remove(Category category);
    Task ReplaceUserDefinedForOwnerAsync(Guid ownerId, IEnumerable<Category> categories, CancellationToken ct = default);
    Task<bool> AnyItemsUseCategoryAsync(string id, Guid ownerId, CancellationToken ct = default);
}
