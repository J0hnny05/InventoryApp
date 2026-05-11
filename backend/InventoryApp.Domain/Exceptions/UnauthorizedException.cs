namespace InventoryApp.Domain.Exceptions;

public class UnauthorizedException : DomainException
{
    public UnauthorizedException(string message = "Authentication required.") : base(message) { }
}
