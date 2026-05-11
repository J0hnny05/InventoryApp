namespace InventoryApp.Application.Auth;

public class JwtOptions
{
    public string Issuer { get; set; } = "InventoryApp";
    public string Audience { get; set; } = "InventoryApp.Client";
    public string SigningKey { get; set; } = string.Empty;
    /// <summary>Access token lifetime in seconds.</summary>
    public int LifetimeSeconds { get; set; } = 900;          // 15 minutes
    /// <summary>Refresh token lifetime in seconds.</summary>
    public int RefreshLifetimeSeconds { get; set; } = 604800; // 7 days
    /// <summary>Validate token expiration with this clock skew (seconds).</summary>
    public int ClockSkewSeconds { get; set; } = 5;
}

public class DemoOptions
{
    public bool EnableTokenEndpoint { get; set; } = true;
    public int TokenLifetimeSeconds { get; set; } = 60;
}
