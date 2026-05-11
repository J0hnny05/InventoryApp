namespace InventoryApp.Domain.Exceptions;

public class ForbiddenException : DomainException
{
    public ForbiddenException(string message = "You don't have permission to perform this action.") : base(message) { }
}
