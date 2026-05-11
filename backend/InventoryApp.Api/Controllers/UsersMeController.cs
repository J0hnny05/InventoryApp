using InventoryApp.Application.Auth;
using InventoryApp.Application.Common;
using InventoryApp.Application.Features.Users.Commands;
using InventoryApp.Application.Features.Users.Dtos;
using InventoryApp.Application.Features.Users.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryApp.Api.Controllers;

[ApiController]
[Route("api/users/me")]
[Tags("Helpers")]
[Produces("application/json")]
[Authorize(Policy = PermissionPolicies.RequireOwnerOrAdmin)]
public class UsersMeController : ControllerBase
{
    private readonly IMediator _mediator;
    public UsersMeController(IMediator mediator) => _mediator = mediator;

    /// <summary>List the helpers you have created (paginated).</summary>
    [HttpGet("helpers")]
    [ProducesResponseType(typeof(PagedResult<HelperResponse>), StatusCodes.Status200OK)]
    public async Task<PagedResult<HelperResponse>> ListHelpers([FromQuery] int? skip, [FromQuery] int? take, CancellationToken ct) =>
        await _mediator.Send(new ListMyHelpersQuery(skip, take), ct);

    /// <summary>Create a helper account that can manage your inventory under the granted permissions.</summary>
    [HttpPost("helpers")]
    [ProducesResponseType(typeof(HelperResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<HelperResponse>> CreateHelper([FromBody] CreateHelperRequest body, CancellationToken ct)
    {
        var helper = await _mediator.Send(new CreateHelperCommand(body.Username, body.Password, body.Email, body.Permissions), ct);
        return CreatedAtAction(nameof(ListHelpers), new { }, helper);
    }

    /// <summary>Update the permission toggles on one of your helpers. The helper is forced to re-login.</summary>
    [HttpPatch("helpers/{helperId:guid}/permissions")]
    [ProducesResponseType(typeof(HelperResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<HelperResponse> UpdatePermissions(Guid helperId, [FromBody] UpdateHelperPermissionsRequest body, CancellationToken ct) =>
        await _mediator.Send(new UpdateHelperPermissionsCommand(helperId, body.Permissions), ct);

    /// <summary>Delete one of your helper accounts.</summary>
    [HttpDelete("helpers/{helperId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteHelper(Guid helperId, CancellationToken ct)
    {
        await _mediator.Send(new DeleteHelperCommand(helperId), ct);
        return NoContent();
    }
}
