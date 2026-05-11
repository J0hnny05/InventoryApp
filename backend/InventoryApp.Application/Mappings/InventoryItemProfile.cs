using AutoMapper;
using InventoryApp.Application.Features.InventoryItems.Dtos;
using InventoryApp.Domain.Common;
using InventoryApp.Domain.Entities;
using InventoryApp.Domain.Enums;

namespace InventoryApp.Application.Mappings;

public class InventoryItemProfile : Profile
{
    public InventoryItemProfile()
    {
        CreateMap<InventoryItem, InventoryItemResponse>()
            .ForCtorParam(nameof(InventoryItemResponse.Status),
                o => o.MapFrom(s => s.Status.ToString().ToLowerInvariant()))
            .ForCtorParam(nameof(InventoryItemResponse.Condition),
                o => o.MapFrom(s => s.Condition.HasValue ? s.Condition.Value.ToString().ToLowerInvariant() : null))
            .ForCtorParam(nameof(InventoryItemResponse.Tags),
                o => o.MapFrom(s => (IReadOnlyList<string>)s.Tags))
            .ForCtorParam(nameof(InventoryItemResponse.Profit),
                o => o.MapFrom(s => ItemComputations.Profit(s)))
            .ForCtorParam(nameof(InventoryItemResponse.Roi),
                o => o.MapFrom(s => ItemComputations.Roi(s)))
            .ForCtorParam(nameof(InventoryItemResponse.DaysOwned),
                o => o.MapFrom(s => ItemComputations.DaysOwned(s, DateTime.UtcNow)));

        CreateMap<CreateInventoryItemRequest, InventoryItem>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.OwnerUserId, o => o.Ignore())
            .ForMember(d => d.Pinned, o => o.Ignore())
            .ForMember(d => d.Status, o => o.Ignore())
            .ForMember(d => d.SoldAt, o => o.Ignore())
            .ForMember(d => d.SalePrice, o => o.Ignore())
            .ForMember(d => d.UseCount, o => o.Ignore())
            .ForMember(d => d.LastUsedAt, o => o.Ignore())
            .ForMember(d => d.ViewCount, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore())
            .ForMember(d => d.UpdatedAt, o => o.Ignore())
            .ForMember(d => d.Category, o => o.Ignore())
            .ForMember(d => d.Currency, o => o.MapFrom(s => s.Currency.ToUpperInvariant()))
            .ForMember(d => d.Tags, o => o.MapFrom(s => s.Tags != null ? s.Tags.ToList() : new List<string>()));

        CreateMap<UpdateInventoryItemRequest, InventoryItem>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.OwnerUserId, o => o.Ignore())
            .ForMember(d => d.Pinned, o => o.Ignore())
            .ForMember(d => d.Status, o => o.Ignore())
            .ForMember(d => d.SoldAt, o => o.Ignore())
            .ForMember(d => d.SalePrice, o => o.Ignore())
            .ForMember(d => d.UseCount, o => o.Ignore())
            .ForMember(d => d.LastUsedAt, o => o.Ignore())
            .ForMember(d => d.ViewCount, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore())
            .ForMember(d => d.UpdatedAt, o => o.Ignore())
            .ForMember(d => d.Category, o => o.Ignore())
            .ForMember(d => d.Currency, o => o.MapFrom(s => s.Currency.ToUpperInvariant()))
            .ForMember(d => d.Tags, o => o.MapFrom(s => s.Tags != null ? s.Tags.ToList() : new List<string>()));

        CreateMap<InventoryItemImportEntry, InventoryItem>()
            .ForMember(d => d.OwnerUserId, o => o.Ignore())
            .ForMember(d => d.Status, o => o.MapFrom(s => Enum.Parse<ItemStatus>(s.Status, true)))
            .ForMember(d => d.Condition, o => o.MapFrom(s =>
                string.IsNullOrEmpty(s.Condition) ? (ItemCondition?)null : Enum.Parse<ItemCondition>(s.Condition, true)))
            .ForMember(d => d.Tags, o => o.MapFrom(s => s.Tags != null ? s.Tags.ToList() : new List<string>()))
            .ForMember(d => d.Category, o => o.Ignore());
    }
}
