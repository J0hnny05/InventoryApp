namespace InventoryApp.Domain.Entities;

public class Category
{
    public string Id { get; set; } = default!;
    public string Name { get; set; } = default!;
    public bool BuiltIn { get; set; }
    public string? Color { get; set; }
    public string? Icon { get; set; }
    /// <summary>Null for built-in/global categories; otherwise the OWNER who created this category.</summary>
    public Guid? OwnerUserId { get; set; }
}
