using InventoryApp.Application.Features.Auth.Commands;
using InventoryApp.Application.Features.Auth.Dtos;
using InventoryApp.Application.Features.Auth.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryApp.Api.Controllers;

[ApiController]
[Route("api/auth")]
[Tags("Auth")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    public AuthController(IMediator mediator) => _mediator = mediator;

    /// <summary>Public registration. Always creates an OWNER account.</summary>
    [AllowAnonymous]
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<AuthResponse> Register([FromBody] RegisterRequest body, CancellationToken ct) =>
        await _mediator.Send(new RegisterCommand(body.Username, body.Password, body.Email), ct);

    /// <summary>Login with username + password. Returns access + refresh tokens.</summary>
    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<AuthResponse> Login([FromBody] LoginRequest body, CancellationToken ct) =>
        await _mediator.Send(new LoginCommand(body.Username, body.Password), ct);

    /// <summary>Rotate the refresh token and obtain a new access token.</summary>
    [AllowAnonymous]
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<AuthResponse> Refresh([FromBody] RefreshRequest body, CancellationToken ct) =>
        await _mediator.Send(new RefreshCommand(body.RefreshToken), ct);

    /// <summary>Revoke all refresh tokens for the current user.</summary>
    [Authorize]
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        await _mediator.Send(new LogoutCommand(), ct);
        return NoContent();
    }

    /// <summary>Get the authenticated user's profile (and helper permissions if applicable).</summary>
    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(AuthUser), StatusCodes.Status200OK)]
    public async Task<AuthUser> Me(CancellationToken ct) =>
        await _mediator.Send(new GetMyProfileQuery(), ct);

    /// <summary>Change the current user's password. All refresh tokens are invalidated.</summary>
    [Authorize]
    [HttpPost("change-password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest body, CancellationToken ct)
    {
        await _mediator.Send(new ChangePasswordCommand(body.CurrentPassword, body.NewPassword), ct);
        return NoContent();
    }
}
