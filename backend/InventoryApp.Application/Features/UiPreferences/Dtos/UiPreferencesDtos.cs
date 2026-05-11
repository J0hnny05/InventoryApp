using InventoryApp.Domain.Enums;

namespace InventoryApp.Application.Features.UiPreferences.Dtos;

public sealed record UiPreferencesResponse(
    string DefaultCurrency,
    Theme Theme,
    InventorySort InventorySort,
    string SearchTerm,
    string? FilterCategoryId);

public sealed record UpdateUiPreferencesRequest(
    string? DefaultCurrency,
    Theme? Theme,
    InventorySort? InventorySort,
    string? SearchTerm,
    string? FilterCategoryId);
