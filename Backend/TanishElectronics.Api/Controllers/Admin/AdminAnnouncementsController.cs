using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.DTOs.Admin.Announcements;
using TanishElectronics.Api.DTOs.Admin.Feedback;
using TanishElectronics.Api.Filters;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[Authorize(Policy = AppPolicies.AdminOnly)]
[EnableRateLimiting(RateLimitPolicies.AdminAction)]
[Route("admin/announcements")]
public class AdminAnnouncementsController : ControllerBase
{
    private readonly IAnnouncementService _service;
    public AdminAnnouncementsController(IAnnouncementService service)
    {
        _service = service;
    }
    [HttpGet]
    public async Task<IActionResult> GetAnnouncements([FromQuery] AdminAnnouncementQueryDto query)
    {
        var result = await _service.GetAdminAnnouncementsAsync(query);
        return Ok(result);
    }
    [HttpPost]
    public async Task<IActionResult> CreateAnnouncement([FromBody] CreateAnnouncementDto dto)
    {
        var result = await _service.CreateAnnouncementAsync(dto, null);
        return Ok(result);
    }
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateAnnouncement([FromRoute] int id, [FromBody] UpdateAnnouncementDto dto)
    {
        await _service.UpdateAnnouncementAsync(id, dto);

        return Ok(new { message = "Announcement updated successfully." });
    }
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteAnnouncement([FromRoute] int id)
    {
        await _service.SoftDeleteAnnouncementAsync(id);

        return Ok(new { message = "Announcement deleted successfully." });
    }
    [EnableRateLimiting(RateLimitPolicies.ImageUpload)]
    [HttpPost("{id:int}/image")]
    public async Task<IActionResult> UploadAnnouncementImage([FromRoute] int id, IFormFile image)
    {

        var imageUrl = await _service.UpdateAnnouncementImageAsync(id, image);

        return Ok(new
        {
            imageUrl,
            message = "Image added successfully."
        });
    }
}