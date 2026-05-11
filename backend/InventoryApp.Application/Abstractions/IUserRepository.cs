using InventoryApp.Application.Common;
using InventoryApp.Domain.Entities;
using InventoryApp.Domain.Enums;

namespace InventoryApp.Application.Abstractions;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id, bool includePermissions = false, CancellationToken ct = default);
    Task<User?> GetByUsernameAsync(string username, bool includePermissions = false, CancellationToken ct = default);
    Task<bool> UsernameExistsAsync(string username, CancellationToken ct = default);
    Task AddAsync(User user, CancellationToken ct = default);
    void Remove(User user);
    Task<(List<User> Items, int Total)> ListHelpersAsync(Guid ownerId, PagedQuery page, CancellationToken ct = default);
    Task<(List<User> Items, int Total)> ListAllAsync(PagedQuery page, UserRole? roleFilter, CancellationToken ct = default);
}
