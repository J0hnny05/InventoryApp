using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using InventoryApp.Api;
using InventoryApp.Api.Authorization;
using InventoryApp.Api.Middleware;
using InventoryApp.Application.Abstractions;
using InventoryApp.Application.Auth;
using InventoryApp.Application.Common;
using InventoryApp.Application.Features.ExchangeRates;
using InventoryApp.Infrastructure;
using InventoryApp.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// --- Options ---
builder.Services.Configure<ExchangeRatesOptions>(builder.Configuration.GetSection("ExchangeRates"));
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<DemoOptions>(builder.Configuration.GetSection("Demo"));

// --- Application + Infrastructure ---
builder.Services
    .AddApplication()
    .AddInfrastructure(builder.Configuration);

// --- Current user context ---
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserContext, CurrentUserContext>();

// --- Authentication (JWT bearer) ---
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.SaveToken = true;
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = string.IsNullOrWhiteSpace(jwt.SigningKey)
                ? new SymmetricSecurityKey(Encoding.UTF8.GetBytes("development-only-fallback-key-please-rotate"))
                : new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey)),
            ClockSkew = TimeSpan.FromSeconds(jwt.ClockSkewSeconds)
        };
    });

// --- Authorization policies ---
builder.Services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(PermissionPolicies.RequireRead,
        p => p.RequireAuthenticatedUser().AddRequirements(new PermissionRequirement(Permissions.Read)));
    options.AddPolicy(PermissionPolicies.RequireWrite,
        p => p.RequireAuthenticatedUser().AddRequirements(new PermissionRequirement(Permissions.Write)));
    options.AddPolicy(PermissionPolicies.RequireDelete,
        p => p.RequireAuthenticatedUser().AddRequirements(new PermissionRequirement(Permissions.Delete)));
    options.AddPolicy(PermissionPolicies.RequireAdmin,
        p => p.RequireAuthenticatedUser().RequireRole(Roles.Admin));
    options.AddPolicy(PermissionPolicies.RequireOwnerOrAdmin,
        p => p.RequireAuthenticatedUser().RequireRole(Roles.Owner, Roles.Admin));
});

builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "InventoryApp API", Version = "v1" });
    var xml = Path.Combine(AppContext.BaseDirectory, "InventoryApp.Api.xml");
    if (File.Exists(xml)) c.IncludeXmlComments(xml);

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste a JWT obtained from /api/auth/login or the demo /api/token endpoint."
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p
    .WithOrigins(allowedOrigins)
    .AllowAnyHeader()
    .AllowAnyMethod()));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    if (builder.Configuration.GetValue<bool>("ApplyMigrationsOnStartup"))
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.Migrate();

        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        await InventoryApp.Infrastructure.Persistence.Seed.DefaultAdminSeeder.EnsureAsync(db, hasher);
    }
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
