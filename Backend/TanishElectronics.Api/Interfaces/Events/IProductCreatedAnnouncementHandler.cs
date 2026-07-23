using TanishElectronics.Api.Events.Products;

namespace TanishElectronics.Api.Interfaces.Events;

public interface IProductCreatedAnnouncementHandler
{
    Task HandleAsync(ProductCreatedEventArgs args);
}