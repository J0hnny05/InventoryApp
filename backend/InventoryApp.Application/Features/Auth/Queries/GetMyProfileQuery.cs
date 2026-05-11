using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Features.Auth.Dtos;
using MediatR;

namespace InventoryApp.Application.Features.Auth.Queries;

public sealed record GetMyProfileQuery : IRequest<AuthUser>;

public class GetMyProfileHandler : IRequestHandler<GetMyProfileQuery, AuthUser>
{
    private readonly ICurrentUserContext _current;

    public GetMyProfileHandler(ICurrentUserContext current) => _current = current;

    public async Task<AuthUser> Handle(GetMyProfileQuery request, CancellationToken ct)
    {
        var user = await _current.RequireUserAsync(ct);
        return AuthMappingHelper.ToAuthUser(user);
    }
}
