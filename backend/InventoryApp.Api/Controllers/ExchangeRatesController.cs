using InventoryApp.Application.Features.ExchangeRates.Commands;
using InventoryApp.Application.Features.ExchangeRates.Dtos;
using InventoryApp.Application.Features.ExchangeRates.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryApp.Api.Controllers;

[ApiController]
[Route("api/exchange-rates")]
[Tags("ExchangeRates")]
[Produces("application/json")]
[Authorize]
public class ExchangeRatesController : ControllerBase
{
    private readonly IMediator _mediator;
    public ExchangeRatesController(IMediator mediator) => _mediator = mediator;

    /// <summary>Get exchange rates, refreshing from upstream if the cache is stale.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ExchangeRatesResponse), StatusCodes.Status200OK)]
    public async Task<ExchangeRatesResponse> Get([FromQuery] string baseCurrency = "EUR", CancellationToken ct = default) =>
        await _mediator.Send(new GetExchangeRatesQuery(baseCurrency), ct);

    /// <summary>Force a fresh fetch from the upstream provider regardless of cache age.</summary>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(ExchangeRatesResponse), StatusCodes.Status200OK)]
    public async Task<ExchangeRatesResponse> Refresh([FromQuery] string baseCurrency = "EUR", CancellationToken ct = default) =>
        await _mediator.Send(new ForceRefreshExchangeRatesCommand(baseCurrency), ct);
}
