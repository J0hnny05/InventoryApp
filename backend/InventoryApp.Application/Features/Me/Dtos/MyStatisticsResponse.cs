namespace InventoryApp.Application.Features.Me.Dtos;

public sealed record CurrencyAmount(string Currency, decimal Amount);

public sealed record RecentItemSummary(Guid Id, string Name, string Currency, decimal PurchasePrice, DateTime CreatedAt);

public sealed record RecentSaleSummary(Guid Id, string Name, string Currency, decimal Profit, DateOnly SoldAt);

public sealed record MyStatisticsResponse(
    string Username,
    string Role,
    int OwnedCount,
    int SoldCount,
    int PinnedCount,
    int TotalUseCount,
    int TotalViewCount,
    IReadOnlyList<CurrencyAmount> OwnedValueByCurrency,
    IReadOnlyList<CurrencyAmount> RealizedProfitByCurrency,
    IReadOnlyList<RecentItemSummary> RecentItems,
    IReadOnlyList<RecentSaleSummary> RecentSales,
    DateTime? LastLoginAt,
    DateTime CreatedAt);
