using InventoryApp.Domain.Entities;

namespace InventoryApp.Application.Abstractions;

public interface IUiPreferencesRepository
{
    Task<UiPreferences> GetForUserAsync(Guid userId, CancellationToken ct = default);
}
