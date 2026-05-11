namespace InventoryApp.Domain.Entities;

public class HelperPermissions
{
    public Guid HelperUserId { get; set; }   // PK = FK to User.Id
    public bool CanAdd { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }
    public bool CanSell { get; set; }
    public bool CanRecordUse { get; set; }

    public User? HelperUser { get; set; }
}
