using AutoMapper;
using InventoryApp.Application.Features.Categories.Dtos;
using InventoryApp.Domain.Entities;

namespace InventoryApp.Application.Mappings;

public class CategoryProfile : Profile
{
    public CategoryProfile()
    {
        CreateMap<Category, CategoryResponse>();
        CreateMap<CategoryImportEntry, Category>()
            .ForMember(d => d.OwnerUserId, o => o.Ignore());
    }
}
