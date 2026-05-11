using AutoMapper;
using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Features.UiPreferences.Dtos;
using MediatR;

namespace InventoryApp.Application.Features.UiPreferences.Queries;

public sealed record GetUiPreferencesQuery : IRequest<UiPreferencesResponse>;

public class GetUiPreferencesHandler : IRequestHandler<GetUiPreferencesQuery, UiPreferencesResponse>
{
    private readonly IUiPreferencesRepository _repo;
    private readonly ICurrentUserContext _current;
    private readonly IMapper _mapper;

    public GetUiPreferencesHandler(IUiPreferencesRepository repo, ICurrentUserContext current, IMapper mapper)
    {
        _repo = repo;
        _current = current;
        _mapper = mapper;
    }

    public async Task<UiPreferencesResponse> Handle(GetUiPreferencesQuery request, CancellationToken ct)
    {
        var user = await _current.RequireUserAsync(ct);
        var prefs = await _repo.GetForUserAsync(user.Id, ct);
        return _mapper.Map<UiPreferencesResponse>(prefs);
    }
}
