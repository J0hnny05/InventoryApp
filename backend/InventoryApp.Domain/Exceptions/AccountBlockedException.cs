namespace InventoryApp.Domain.Exceptions;

public class AccountBlockedException : DomainException
{
    public AccountBlockedException() : base("This account has been blocked.") { }
}
