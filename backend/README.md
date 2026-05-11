# InventoryApp Backend

.NET 9 layered backend for the Angular InventoryApp. Single-tenant, no auth.

## Stack
- ASP.NET Core 9 Web API
- EF Core 9 + Npgsql (PostgreSQL)
- MediatR + AutoMapper + FluentValidation
- Swashbuckle (Swagger)

## Solution layout
```
backend/
  InventoryApp.Domain/         entities, enums, exceptions, ItemComputations
  InventoryApp.Application/    DTOs, MediatR features, services, mappers, validators, abstractions
  InventoryApp.Infrastructure/ AppDbContext, EF configs, repositories, migrations, OpenErApiClient
  InventoryApp.Api/            controllers, Program.cs, settings, exception middleware
```

## Prerequisites
- .NET 9 SDK
- PostgreSQL running locally on port 5432 with user `postgres` / password `postgres`
- Database `inventoryapp_dev` (created by migrations on startup)

## Run (Dev)
```powershell
cd backend
createdb -U postgres inventoryapp_dev      # one-time, via psql or pgAdmin
dotnet run --project InventoryApp.Api
```
On startup in Development the app applies pending migrations (`ApplyMigrationsOnStartup: true`) and seeds 7 default categories + the singleton UI preferences row.

Swagger UI: `https://localhost:<port>/swagger`

## Endpoints (20)

### Items — `/api/items`
| Verb | Route |
|---|---|
| GET    | `/api/items` (?search,categoryId,status,sort) |
| GET    | `/api/items/{id}` |
| POST   | `/api/items` |
| PUT    | `/api/items/{id}` |
| DELETE | `/api/items/{id}` |
| POST   | `/api/items/{id}/pin` |
| POST   | `/api/items/{id}/sell` |
| POST   | `/api/items/{id}/use` |
| POST   | `/api/items/{id}/view` |
| POST   | `/api/items/bulk-import` |

### Categories — `/api/categories`
| Verb | Route |
|---|---|
| GET    | `/api/categories` |
| GET    | `/api/categories/{id}` |
| POST   | `/api/categories` |
| PATCH  | `/api/categories/{id}` (rename) |
| DELETE | `/api/categories/{id}` (409 if BuiltIn) |
| POST   | `/api/categories/bulk-import` |

### UI Preferences (singleton) — `/api/ui-preferences`
| Verb | Route |
|---|---|
| GET | `/api/ui-preferences` |
| PUT | `/api/ui-preferences` |

### Exchange Rates — `/api/exchange-rates`
| Verb | Route |
|---|---|
| GET  | `/api/exchange-rates` (refresh-if-stale) |
| POST | `/api/exchange-rates/refresh` (force) |

## Configuration
- `appsettings.json` — shared (CORS allowed origins, exchange-rates upstream URL + 12h staleness threshold)
- `appsettings.Development.json` — local Postgres connection, `ApplyMigrationsOnStartup: true`
- `appsettings.Production.json` — empty connection placeholder (bind via env var `ConnectionStrings__Postgres`), `ApplyMigrationsOnStartup: false`

## EF migrations
```powershell
cd backend
# add new migration
dotnet ef migrations add <Name> -p InventoryApp.Infrastructure -s InventoryApp.Api -o Migrations
# apply manually (Prod)
dotnet ef database update -p InventoryApp.Infrastructure -s InventoryApp.Api
```

## Layer responsibilities
- **Controller** — thin; sends MediatR commands/queries.
- **Handler** — orchestration (load → delegate to service → save → map).
- **Service** — pure domain rules (`MarkSold`, `EnsureDeletable`, `IsStale`). No DbContext access.
- **Repository** — data access only.
- **DbContext** — EF only; doubles as `IUnitOfWork`.

## Smoke test (PowerShell)
```powershell
$base = "http://localhost:5000/api"
Invoke-RestMethod "$base/categories"
Invoke-RestMethod "$base/ui-preferences"
$body = @{ name="Test Jacket"; categoryId="cat-clothing"; purchasePrice=120; purchaseDate="2026-05-01"; currency="EUR" } | ConvertTo-Json
$item = Invoke-RestMethod -Method Post -Uri "$base/items" -Body $body -ContentType "application/json"
Invoke-RestMethod -Method Post "$base/items/$($item.id)/pin"
$sell = @{ salePrice=180; soldAt="2026-05-09" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$base/items/$($item.id)/sell" -Body $sell -ContentType "application/json"
```
