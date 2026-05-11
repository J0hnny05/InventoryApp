using System.Reflection;
using FluentValidation;
using InventoryApp.Application.Auth;
using InventoryApp.Application.Common.Behaviors;
using InventoryApp.Application.Services;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace InventoryApp.Application.Common;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(assembly));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

        services.AddAutoMapper(cfg => { }, assembly);
        services.AddValidatorsFromAssembly(assembly);

        services.AddScoped<IInventoryItemService, InventoryItemService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<IExchangeRatesService, ExchangeRatesService>();
        services.AddScoped<IPermissionGuard, PermissionGuard>();

        return services;
    }
}
