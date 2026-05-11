namespace InventoryApp.Domain.Exceptions;

public class BuiltInCategoryException : DomainException
{
    public BuiltInCategoryException(string id)
        : base($"Category '{id}' is built-in and cannot be modified or deleted.") { }
}
