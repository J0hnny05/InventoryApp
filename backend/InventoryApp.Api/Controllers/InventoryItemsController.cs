using InventoryApp.Application.Auth;
using InventoryApp.Application.Common;
using InventoryApp.Application.Features.InventoryItems.Commands;
using InventoryApp.Application.Features.InventoryItems.Dtos;
using InventoryApp.Application.Features.InventoryItems.Queries;
using InventoryApp.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryApp.Api.Controllers;

[ApiController]
[Route("api/items")]
[Tags("Items")]
[Produces("application/json")]
[Authorize]
public class InventoryItemsController : ControllerBase
{
    private readonly IMediator _mediator;
    public InventoryItemsController(IMediator mediator) => _mediator = mediator;

    /// <summary>List inventory items, optionally filtered, sorted, and paginated.</summary>
    [HttpGet]
    [Authorize(Policy = PermissionPolicies.RequireRead)]
    [ProducesResponseType(typeof(PagedResult<InventoryItemResponse>), StatusCodes.Status200OK)]
    public async Task<PagedResult<InventoryItemResponse>> List(
        [FromQuery] string? search,
        [FromQuery] string? categoryId,
        [FromQuery] ItemStatus? status,
        [FromQuery] InventorySort? sort,
        [FromQuery] int? skip,
        [FromQuery] int? take,
        CancellationToken ct) =>
        await _mediator.Send(new ListInventoryItemsRequest(search, categoryId, status, sort, skip, take), ct);

    /// <summary>Get an inventory item by id.</summary>
    [HttpGet("{id:guid}")]
    [Authorize(Policy = PermissionPolicies.RequireRead)]
    [ProducesResponseType(typeof(InventoryItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<InventoryItemResponse> Get(Guid id, CancellationToken ct) =>
        await _mediator.Send(new GetInventoryItemByIdQuery(id), ct);

    /// <summary>Create a new inventory item.</summary>
    [HttpPost]
    [Authorize(Policy = PermissionPolicies.RequireWrite)]
    [ProducesResponseType(typeof(InventoryItemResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<InventoryItemResponse>> Create([FromBody] CreateInventoryItemRequest body, CancellationToken ct)
    {
        var created = await _mediator.Send(new CreateInventoryItemCommand(body), ct);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    /// <summary>Update an inventory item's editable fields.</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = PermissionPolicies.RequireWrite)]
    [ProducesResponseType(typeof(InventoryItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<InventoryItemResponse> Update(Guid id, [FromBody] UpdateInventoryItemRequest body, CancellationToken ct) =>
        await _mediator.Send(new UpdateInventoryItemCommand(id, body), ct);

    /// <summary>Delete an inventory item.</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = PermissionPolicies.RequireDelete)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteInventoryItemCommand(id), ct);
        return NoContent();
    }

    /// <summary>Toggle the pinned flag on an inventory item.</summary>
    [HttpPost("{id:guid}/pin")]
    [Authorize(Policy = PermissionPolicies.RequireWrite)]
    [ProducesResponseType(typeof(InventoryItemResponse), StatusCodes.Status200OK)]
    public async Task<InventoryItemResponse> TogglePin(Guid id, CancellationToken ct) =>
        await _mediator.Send(new TogglePinInventoryItemCommand(id), ct);

    /// <summary>Mark an inventory item as sold.</summary>
    [HttpPost("{id:guid}/sell")]
    [Authorize(Policy = PermissionPolicies.RequireWrite)]
    [ProducesResponseType(typeof(InventoryItemResponse), StatusCodes.Status200OK)]
    public async Task<InventoryItemResponse> Sell(Guid id, [FromBody] SellInventoryItemRequest body, CancellationToken ct) =>
        await _mediator.Send(new SellInventoryItemCommand(id, body.SalePrice, body.SoldAt), ct);

    /// <summary>Increment the use counter and update last-used timestamp.</summary>
    [HttpPost("{id:guid}/use")]
    [Authorize(Policy = PermissionPolicies.RequireWrite)]
    [ProducesResponseType(typeof(InventoryItemResponse), StatusCodes.Status200OK)]
    public async Task<InventoryItemResponse> RecordUse(Guid id, CancellationToken ct) =>
        await _mediator.Send(new RecordUseInventoryItemCommand(id), ct);

    /// <summary>Increment the view counter.</summary>
    [HttpPost("{id:guid}/view")]
    [Authorize(Policy = PermissionPolicies.RequireRead)]
    [ProducesResponseType(typeof(InventoryItemResponse), StatusCodes.Status200OK)]
    public async Task<InventoryItemResponse> RecordView(Guid id, CancellationToken ct) =>
        await _mediator.Send(new RecordViewInventoryItemCommand(id), ct);

    /// <summary>Replace all inventory items from an import payload (transactional). Owner only.</summary>
    [HttpPost("bulk-import")]
    [Authorize(Policy = PermissionPolicies.RequireOwnerOrAdmin)]
    [ProducesResponseType(typeof(IReadOnlyList<InventoryItemResponse>), StatusCodes.Status200OK)]
    public async Task<IReadOnlyList<InventoryItemResponse>> BulkImport([FromBody] BulkImportInventoryRequest body, CancellationToken ct) =>
        await _mediator.Send(new BulkImportInventoryItemsCommand(body.Items), ct);
}
