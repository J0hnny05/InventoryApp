using InventoryApp.Domain.Enums;

namespace InventoryApp.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Username { get; set; } = default!;
    public string? Email { get; set; }
    public string PasswordHash { get; set; } = default!;
    public UserRole Role { get; set; } = UserRole.Owner;
    public Guid? OwnerUserId { get; set; }     // non-null for Helper rows
    public bool IsBlocked { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }

    public User? OwnerUser { get; set; }
    public HelperPermissions? HelperPermissions { get; set; }

    public Guid EffectiveOwnerId => Role == UserRole.Helper && OwnerUserId.HasValue ? OwnerUserId.Value : Id;
}
