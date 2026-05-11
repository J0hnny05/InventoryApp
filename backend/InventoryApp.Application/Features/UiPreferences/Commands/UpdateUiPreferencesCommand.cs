using AutoMapper;
using FluentValidation;
using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Features.UiPreferences.Dtos;
using InventoryApp.Domain.Enums;
using MediatR;

namespace InventoryApp.Application.Features.UiPreferences.Commands;

public sealed record UpdateUiPreferencesCommand(
    string? DefaultCurrency,
    Theme? Theme,
    InventorySort? InventorySort,
    string? SearchTerm,
    string? FilterCategoryId) : IRequest<UiPreferencesResponse>;

public class UpdateUiPreferencesValidator : AbstractValidator<UpdateUiPreferencesCommand>
{
    public UpdateUiPreferencesValidator()
    {
        When(x => x.DefaultCurrency != null, () =>
            RuleFor(x => x.DefaultCurrency!).Length(3));
        RuleFor(x => x.SearchTerm).MaximumLength(200);
    }
}

public class UpdateUiPreferencesHandler : IRequestHandler<UpdateUiPreferencesCommand, UiPreferencesResponse>
{
    private readonly IUiPreferencesRepository _repo;
    private readonly ICurrentUserContext _current;
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public UpdateUiPreferencesHandler(IUiPreferencesRepository repo, ICurrentUserContext current, IUnitOfWork uow, IMapper mapper)
    {
        _repo = repo;
        _current = current;
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<UiPreferencesResponse> Handle(UpdateUiPreferencesCommand cmd, CancellationToken ct)
    {
        var user = await _current.RequireUserAsync(ct);
        var prefs = await _repo.GetForUserAsync(user.Id, ct);

        if (cmd.DefaultCurrency is not null) prefs.DefaultCurrency = cmd.DefaultCurrency.ToUpperInvariant();
        if (cmd.Theme.HasValue) prefs.Theme = cmd.Theme.Value;
        if (cmd.InventorySort.HasValue) prefs.InventorySort = cmd.InventorySort.Value;
        if (cmd.SearchTerm is not null) prefs.SearchTerm = cmd.SearchTerm;
        prefs.FilterCategoryId = cmd.FilterCategoryId;

        await _uow.SaveChangesAsync(ct);
        return _mapper.Map<UiPreferencesResponse>(prefs);
    }
}
