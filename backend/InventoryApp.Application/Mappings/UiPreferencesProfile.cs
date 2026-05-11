using AutoMapper;
using InventoryApp.Application.Features.UiPreferences.Dtos;

namespace InventoryApp.Application.Mappings;

public class UiPreferencesProfile : Profile
{
    public UiPreferencesProfile()
    {
        CreateMap<Domain.Entities.UiPreferences, UiPreferencesResponse>();
    }
}
