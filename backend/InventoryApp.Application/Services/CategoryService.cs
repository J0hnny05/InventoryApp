using InventoryApp.Domain.Entities;
using InventoryApp.Domain.Exceptions;

namespace InventoryApp.Application.Services;

public class CategoryService : ICategoryService
{
    public void EnsureDeletable(Category category)
    {
        if (category.BuiltIn) throw new BuiltInCategoryException(category.Id);
    }

    public void Rename(Category category, string newName)
    {
        if (category.BuiltIn) throw new BuiltInCategoryException(category.Id);
        var trimmed = newName?.Trim();
        if (string.IsNullOrEmpty(trimmed))
            throw new DomainException("Category name cannot be empty.");
        category.Name = trimmed;
    }
}
