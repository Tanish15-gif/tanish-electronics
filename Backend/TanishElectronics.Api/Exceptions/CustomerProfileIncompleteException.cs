namespace TanishElectronics.Api.Exceptions;

public class CustomerProfileIncompleteException : Exception
{
    public CustomerProfileIncompleteException(string message) : base(message)
    {
    }
}