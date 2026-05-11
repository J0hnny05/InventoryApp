using InventoryApp.Domain.Entities;

namespace InventoryApp.Infrastructure.Persistence.Seed;

public static class DefaultCategoriesSeed
{
    public static readonly Category[] Categories =
    {
        new() { Id = "cat-clothing",    Name = "Clothing",    BuiltIn = true, Icon = "checkroom",       Color = "#C8B5C4" },
        new() { Id = "cat-books",       Name = "Books",       BuiltIn = true, Icon = "menu_book",       Color = "#D8CFBE" },
        new() { Id = "cat-electronics", Name = "Electronics", BuiltIn = true, Icon = "devices",         Color = "#9CB3C8" },
        new() { Id = "cat-furniture",   Name = "Furniture",   BuiltIn = true, Icon = "chair",           Color = "#D9B97E" },
        new() { Id = "cat-vehicles",    Name = "Vehicles",    BuiltIn = true, Icon = "directions_car",  Color = "#7FA88A" },
        new() { Id = "cat-investments", Name = "Investments", BuiltIn = true, Icon = "trending_up",     Color = "#8FA39C" },
        new() { Id = "cat-other",       Name = "Other",       BuiltIn = true, Icon = "category",        Color = "#A39F98" }
    };
}
