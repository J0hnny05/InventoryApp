namespace InventoryApp.Application.Features.Categories.Dtos;

public sealed record CategoryResponse(string Id, string Name, bool BuiltIn, string? Color, string? Icon);

public sealed record CreateCategoryRequest(string Name, string? Color = null, string? Icon = null);

public sealed record RenameCategoryRequest(string Name);

public sealed record BulkImportCategoriesRequest(IReadOnlyList<CategoryImportEntry> Categories);

public sealed record CategoryImportEntry(string Id, string Name, bool BuiltIn, string? Color, string? Icon);
