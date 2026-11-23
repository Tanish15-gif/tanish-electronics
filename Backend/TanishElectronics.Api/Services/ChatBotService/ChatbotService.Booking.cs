using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using TanishElectronics.Api.DTOs.Public.ChatBot;
using TanishElectronics.Api.DTOs.ServiceRequests;
using TanishElectronics.Api.Exceptions;

namespace TanishElectronics.Api.Services;

public partial class ChatbotService
{
    public async Task<ServiceRequestCreatedDto> ConfirmBookingAsync(ConfirmChatBookingDto request)
    {
        var userId = await _currentUserService.GetCurrentAppUserIdAsync();
        var owner = GetOwnedSessionKey(new ChatRequestDto { SessionKey = request.SessionKey }, userId);
        try { return await _bookingDrafts.ConfirmAsync(owner, request.DraftId, _serviceRequestService.CreateAsync); }
        catch (ValidationException) { throw new BadRequestException("Please correct the booking details and request a new summary."); }
        catch (InvalidOperationException) { throw new BadRequestException("The selected service or location is unavailable. Please request an updated summary."); }
    }

    private async Task<ChatBookingDraftDto?> PrepareBookingAsync(string reply, string owner, long revision)
    {
        var match = GenericBookingTagRegex.Match(reply);
        if (!match.Success) return null;
        CreateServiceRequestDto? details;
        try
        {
            details = JsonSerializer.Deserialize<CreateServiceRequestDto>(match.Groups[1].Value,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch (JsonException) { return null; }
        if (details == null) return null;
        var errors = new List<ValidationResult>();
        if (!Validator.TryValidateObject(details, new ValidationContext(details), errors, true) ||
            string.IsNullOrWhiteSpace(details.CustomerName) || string.IsNullOrWhiteSpace(details.DeviceName) ||
            string.IsNullOrWhiteSpace(details.IssueDescription) ||
            details.PhoneNumber.Count(char.IsAsciiDigit) is < 10 or > 15 ||
            !System.Text.RegularExpressions.Regex.IsMatch(details.PhoneNumber, @"^\+?[0-9 ()-]{10,20}$")) return null;
        // A chat draft never selects an account address by an AI-provided database identifier.
        details.CustomerAddressId = null;
        var categories = await _lookUpService.GetServiceCategoriesAsync();
        var category = categories.FirstOrDefault(c => c.Id == details.ServiceCategoryId);
        if (category == null) return null;
        string? locationName = null;
        if (details.ServiceType == "Home Visit")
        {
            var locations = await _lookUpService.GetServiceLocationAsync();
            var location = locations.FirstOrDefault(l => l.Id == details.ServiceLocationId);
            if (location == null || string.IsNullOrWhiteSpace(details.VisitAddress)) return null;
            locationName = location.Name;
        }
        else { details.ServiceLocationId = null; details.VisitAddress = null; }
        return await _bookingDrafts.SetAsync(owner, revision, new ChatBookingDraftDto
        { Details = details, CategoryName = category.Name ?? "Repair", LocationName = locationName });
    }
}
