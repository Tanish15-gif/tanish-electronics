namespace TanishElectronics.Api.DTOs.ServiceRequests;

public class ServiceRequestCreatedDto
{
    public int ServiceRequestId {get;set;}
    public string? RequestNumber {get;set;}
    public string? Status {get;set;}
    public string? Message {get;set;}
}