using TanishElectronics.Api.Events.Products;

namespace TanishElectronics.Api.Delegates;

public delegate Task ProductCreatedEventHandler(ProductCreatedEventArgs args);