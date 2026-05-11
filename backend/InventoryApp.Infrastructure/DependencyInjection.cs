using InventoryApp.Application.Abstractions;
using InventoryApp.Infrastructure.Auth;
using InventoryApp.Infrastructure.ExternalApis;
using InventoryApp.Infrastructure.Persistence;
using InventoryApp.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace InventoryApp.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        var connectionString = config.GetConnectionString("Postgres")
            ?? throw new InvalidOperationException("ConnectionStrings:Postgres is not configured.");

        services.AddDbContext<AppDbContext>(opt => opt.UseNpgsql(connectionString));
        services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<AppDbContext>());

        services.AddScoped<IInventoryItemRepository, InventoryItemRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IUiPreferencesRepository, UiPreferencesRepository>();
        services.AddScoped<IExchangeRatesRepository, ExchangeRatesRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();

        services.AddSingleton<IPasswordHasher, Pbkdf2PasswordHasher>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();

        var endpoint = config["ExchangeRates:Endpoint"]
            ?? "https://open.er-api.com/v6/latest/EUR";
        services.AddHttpClient<IExchangeRatesApiClient, OpenErApiClient>(c =>
        {
            c.Timeout = TimeSpan.FromSeconds(15);
        }).AddTypedClient<IExchangeRatesApiClient>((http, _) => new OpenErApiClient(http, endpoint));

        return services;
    }
}
