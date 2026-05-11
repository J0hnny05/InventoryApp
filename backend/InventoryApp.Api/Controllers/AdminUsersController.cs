using InventoryApp.Application.Auth;
using InventoryApp.Application.Common;
using InventoryApp.Application.Features.Users.Commands;
using InventoryApp.Application.Features.Users.Dtos;
using InventoryApp.Application.Features.Users.Queries;
using InventoryApp.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryApp.Api.Controllers;

[ApiController]
[Route("api/admin/users")]
[Tags("Admin")]
[Produces("application/json")]
[Authorize(Policy = PermissionPolicies.RequireAdmin)]
public class AdminUsersController : ControllerBase
{
    private readonly IMediator _mediator;
    public AdminUsersController(IMediator mediator) => _mediator = mediator;

    /// <summary>List all users (paginated). Optionally filter by role.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<AdminUserListItem>), StatusCodes.Status200OK)]
    public async Task<PagedResult<AdminUserListItem>> List(
        [FromQuery] int? skip, [FromQuery] int? take, [FromQuery] UserRole? role, CancellationToken ct) =>
        await _mediator.Send(new ListAllUsersQuery(skip, take, role), ct);

    /// <summary>Block a user account (revokes refresh tokens).</summary>
    [HttpPost("{id:guid}/block")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Block(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new BlockUserCommand(id, true), ct);
        return NoContent();
    }

    /// <summary>Unblock a user account.</summary>
    [HttpPost("{id:guid}/unblock")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Unblock(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new BlockUserCommand(id, false), ct);
        return NoContent();
    }

    /// <summary>Hard-delete a user account (cascades helpers + inventory).</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new AdminDeleteUserCommand(id), ct);
        return NoContent();
    }
}
