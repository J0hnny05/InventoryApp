namespace InventoryApp.Application.Common;

public sealed record PagedQuery
{
    public int Skip { get; init; } = 0;
    public int Take { get; init; } = 50;

    public PagedQuery() { }
    public PagedQuery(int? skip, int? take)
    {
        Skip = Math.Max(0, skip ?? 0);
        Take = Math.Clamp(take ?? 50, 1, PageDefaults.Max);
    }

    public PagedQuery Normalized() => new(Skip, Take);
}

public sealed record PagedResult<T>(IReadOnlyList<T> Items, int Total, int Skip, int Take);

public static class PageDefaults
{
    public const int Max = 200;
    public const int Default = 50;
}
