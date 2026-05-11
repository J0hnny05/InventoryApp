using AutoMapper;
using FluentValidation;
using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Features.Categories.Dtos;
using InventoryApp.Domain.Entities;
using InventoryApp.Domain.Enums;
using InventoryApp.Domain.Exceptions;
using MediatR;

namespace InventoryApp.Application.Features.Categories.Commands;

public sealed record CreateCategoryCommand(string Name, string? Color, string? Icon) : IRequest<CategoryResponse>;

public class CreateCategoryValidator : AbstractValidator<CreateCategoryCommand>
{
    public CreateCategoryValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(80);
        RuleFor(x => x.Color).MaximumLength(16);
        RuleFor(x => x.Icon).MaximumLength(64);
    }
}

public class CreateCategoryHandler : IRequestHandler<CreateCategoryCommand, CategoryResponse>
{
    private readonly ICategoryRepository _repo;
    private readonly ICurrentUserContext _current;
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public CreateCategoryHandler(ICategoryRepository repo, ICurrentUserContext current, IUnitOfWork uow, IMapper mapper)
    {
        _repo = repo;
        _current = current;
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<CategoryResponse> Handle(CreateCategoryCommand cmd, CancellationToken ct)
    {
        var user = await _current.RequireUserAsync(ct);
        if (user.Role == UserRole.Helper)
            throw new ForbiddenException("Helpers cannot manage categories.");

        var name = cmd.Name.Trim();
        var ownerId = user.EffectiveOwnerId;
        if (await _repo.NameExistsForOwnerAsync(name, ownerId, null, ct))
            throw new Domain.Exceptions.DomainException($"Category '{name}' already exists.");

        var category = new Category
        {
            Id = Guid.NewGuid().ToString("N"),
            Name = name,
            BuiltIn = false,
            Color = cmd.Color,
            Icon = string.IsNullOrWhiteSpace(cmd.Icon) ? "category" : cmd.Icon,
            OwnerUserId = ownerId
        };
        await _repo.AddAsync(category, ct);
        await _uow.SaveChangesAsync(ct);
        return _mapper.Map<CategoryResponse>(category);
    }
}
