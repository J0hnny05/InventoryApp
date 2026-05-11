using InventoryApp.Application.Auth;
using InventoryApp.Application.Common;
using InventoryApp.Application.Features.Categories.Commands;
using InventoryApp.Application.Features.Categories.Dtos;
using InventoryApp.Application.Features.Categories.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryApp.Api.Controllers;

[ApiController]
[Route("api/categories")]
[Tags("Categories")]
[Produces("application/json")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly IMediator _mediator;
    public CategoriesController(IMediator mediator) => _mediator = mediator;

    /// <summary>List built-in + your categories (paginated).</summary>
    [HttpGet]
    [Authorize(Policy = PermissionPolicies.RequireRead)]
    [ProducesResponseType(typeof(PagedResult<CategoryResponse>), StatusCodes.Status200OK)]
    public async Task<PagedResult<CategoryResponse>> List(
        [FromQuery] int? skip, [FromQuery] int? take, CancellationToken ct) =>
        await _mediator.Send(new ListCategoriesQuery(skip, take), ct);

    /// <summary>Get a category by id (built-in or owned by you).</summary>
    [HttpGet("{id}")]
    [Authorize(Policy = PermissionPolicies.RequireRead)]
    [ProducesResponseType(typeof(CategoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<CategoryResponse> Get(string id, CancellationToken ct) =>
        await _mediator.Send(new GetCategoryByIdQuery(id), ct);

    /// <summary>Create a new user-defined category. Owner only.</summary>
    [HttpPost]
    [Authorize(Policy = PermissionPolicies.RequireOwnerOrAdmin)]
    [ProducesResponseType(typeof(CategoryResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<CategoryResponse>> Create([FromBody] CreateCategoryRequest body, CancellationToken ct)
    {
        var cmd = new CreateCategoryCommand(body.Name, body.Color, body.Icon);
        var created = await _mediator.Send(cmd, ct);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    /// <summary>Rename a user-defined category. Owner only.</summary>
    [HttpPatch("{id}")]
    [Authorize(Policy = PermissionPolicies.RequireOwnerOrAdmin)]
    [ProducesResponseType(typeof(CategoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<CategoryResponse> Rename(string id, [FromBody] RenameCategoryRequest body, CancellationToken ct) =>
        await _mediator.Send(new RenameCategoryCommand(id, body.Name), ct);

    /// <summary>Delete a user-defined category. Built-in categories return 409. Owner only.</summary>
    [HttpDelete("{id}")]
    [Authorize(Policy = PermissionPolicies.RequireOwnerOrAdmin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteCategoryCommand(id), ct);
        return NoContent();
    }

    /// <summary>Replace all your user-defined categories from an import payload. Owner only.</summary>
    [HttpPost("bulk-import")]
    [Authorize(Policy = PermissionPolicies.RequireOwnerOrAdmin)]
    [ProducesResponseType(typeof(IReadOnlyList<CategoryResponse>), StatusCodes.Status200OK)]
    public async Task<IReadOnlyList<CategoryResponse>> BulkImport([FromBody] BulkImportCategoriesRequest body, CancellationToken ct) =>
        await _mediator.Send(new BulkImportCategoriesCommand(body.Categories), ct);
}
