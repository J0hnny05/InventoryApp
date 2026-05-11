using InventoryApp.Domain.Entities;

namespace InventoryApp.Application.Services;

public interface ICategoryService
{
    void EnsureDeletable(Category category);
    void Rename(Category category, string newName);
}
