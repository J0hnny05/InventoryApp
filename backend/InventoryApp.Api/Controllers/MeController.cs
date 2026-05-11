using InventoryApp.Application.Features.Me.Dtos;
using InventoryApp.Application.Features.Me.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryApp.Api.Controllers;

[ApiController]
[Route("api/me")]
[Tags("Me")]
[Produces("application/json")]
[Authorize]
public class MeController : ControllerBase
{
    private readonly IMediator _mediator;
    public MeController(IMediator mediator) => _mediator = mediator;

    /// <summary>Personal statistics for the authenticated user (or for their owner if they are a helper).</summary>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(MyStatisticsResponse), StatusCodes.Status200OK)]
    public async Task<MyStatisticsResponse> Statistics(CancellationToken ct) =>
        await _mediator.Send(new GetMyStatisticsQuery(), ct);
}
