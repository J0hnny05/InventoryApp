using InventoryApp.Application.Features.UiPreferences.Commands;
using InventoryApp.Application.Features.UiPreferences.Dtos;
using InventoryApp.Application.Features.UiPreferences.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryApp.Api.Controllers;

[ApiController]
[Route("api/ui-preferences")]
[Tags("UiPreferences")]
[Produces("application/json")]
[Authorize]
public class UiPreferencesController : ControllerBase
{
    private readonly IMediator _mediator;
    public UiPreferencesController(IMediator mediator) => _mediator = mediator;

    /// <summary>Get the singleton UI preferences row.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(UiPreferencesResponse), StatusCodes.Status200OK)]
    public async Task<UiPreferencesResponse> Get(CancellationToken ct) =>
        await _mediator.Send(new GetUiPreferencesQuery(), ct);

    /// <summary>Update UI preferences (partial). Null fields are ignored.</summary>
    [HttpPut]
    [ProducesResponseType(typeof(UiPreferencesResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<UiPreferencesResponse> Update([FromBody] UpdateUiPreferencesRequest body, CancellationToken ct) =>
        await _mediator.Send(new UpdateUiPreferencesCommand(
            body.DefaultCurrency, body.Theme, body.InventorySort, body.SearchTerm, body.FilterCategoryId), ct);
}
