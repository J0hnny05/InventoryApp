using InventoryApp.Domain.Enums;

namespace InventoryApp.Domain.Entities;

/// <summary>UI preferences are stored one row per user (PK = UserId).</summary>
public class UiPreferences
{
    public Guid UserId { get; set; }
    public string DefaultCurrency { get; set; } = "MDL";
    public Theme Theme { get; set; } = Theme.Light;
    public InventorySort InventorySort { get; set; } = InventorySort.PinnedRecent;
    public string SearchTerm { get; set; } = string.Empty;
    public string? FilterCategoryId { get; set; }
}
