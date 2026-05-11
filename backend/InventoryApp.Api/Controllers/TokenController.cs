using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Auth;
using InventoryApp.Application.Features.Auth.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace InventoryApp.Api.Controllers;

/// <summary>
/// Lab 7 demo token endpoint. Issues a no-user JWT with the requested role and/or permissions and a short
/// (1-minute) expiration. Disabled when <c>Demo:EnableTokenEndpoint = false</c>.
/// </summary>
[ApiController]
[Route("api/token")]
[Tags("Demo")]
[Produces("application/json")]
[AllowAnonymous]
public class TokenController : ControllerBase
{
    private readonly IJwtTokenService _jwt;
    private readonly DemoOptions _demo;

    public TokenController(IJwtTokenService jwt, IOptions<DemoOptions> demo)
    {
        _jwt = jwt;
        _demo = demo.Value;
    }

    /// <summary>POST a JSON body with role and/or permissions to receive a demo JWT.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(TokenResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<TokenResponse> Post([FromBody] TokenRequest body)
    {
        if (!_demo.EnableTokenEndpoint) return NotFound();
        return Issue(body.Role, body.Permissions);
    }

    /// <summary>GET ?role=ADMIN|WRITER|VISITOR to receive a demo JWT.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(TokenResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<TokenResponse> Get([FromQuery] string? role, [FromQuery] string? permissions)
    {
        if (!_demo.EnableTokenEndpoint) return NotFound();
        var perms = string.IsNullOrWhiteSpace(permissions)
            ? null
            : permissions.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToArray();
        return Issue(role, perms);
    }

    private TokenResponse Issue(string? role, IReadOnlyList<string>? permissions)
    {
        var lifetime = TimeSpan.FromSeconds(_demo.TokenLifetimeSeconds);
        var issued = _jwt.IssueDemoToken(role, permissions, lifetime);
        return new TokenResponse(issued.AccessToken, issued.ExpiresAtUtc, role, issued.Permissions);
    }
}
