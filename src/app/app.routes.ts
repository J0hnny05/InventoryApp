import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./areas/dashboard/dashboard.page').then((m) => m.DashboardPage),
    title: 'Dashboard · Inventory',
  },
  {
    path: 'inventory',
    loadComponent: () =>
      import('./areas/inventory/inventory.page').then((m) => m.InventoryPage),
    title: 'Inventory',
  },
  {
    path: 'inventory/:id',
    loadComponent: () =>
      import('./areas/item-detail/item-detail.page').then((m) => m.ItemDetailPage),
    title: 'Item · Inventory',
  },
  {
    path: 'sold',
    loadComponent: () =>
      import('./areas/sold/sold.page').then((m) => m.SoldPage),
    title: 'Sold · Inventory',
  },
  {
    path: 'statistics',
    loadComponent: () =>
      import('./areas/statistics/statistics.page').then((m) => m.StatisticsPage),
    title: 'Statistics · Inventory',
  },
  { path: '**', redirectTo: 'dashboard' },
];
