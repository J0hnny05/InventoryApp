import { Routes } from '@angular/router';
import { anonGuard, authGuard, roleGuard } from './auth/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'me' },

  {
    path: 'login',
    canActivate: [anonGuard],
    loadComponent: () => import('./areas/auth/login.page').then((m) => m.LoginPage),
    title: 'Sign in · Inventory',
  },
  {
    path: 'register',
    canActivate: [anonGuard],
    loadComponent: () => import('./areas/auth/register.page').then((m) => m.RegisterPage),
    title: 'Create account · Inventory',
  },

  // Back-compat for old `/dashboard` bookmarks.
  { path: 'dashboard', redirectTo: 'me' },

  {
    path: 'me',
    canActivate: [authGuard],
    loadComponent: () => import('./areas/profile/profile.page').then((m) => m.ProfilePage),
    title: 'Profile · Inventory',
  },
  {
    path: 'me/helpers',
    canActivate: [authGuard, roleGuard(['owner', 'admin'])],
    loadComponent: () => import('./areas/helpers/helpers.page').then((m) => m.HelpersPage),
    title: 'Helpers · Inventory',
  },
  {
    path: 'admin/users',
    canActivate: [authGuard, roleGuard(['admin'])],
    loadComponent: () => import('./areas/admin/admin-users.page').then((m) => m.AdminUsersPage),
    title: 'Users · Admin',
  },

  {
    path: 'inventory',
    canActivate: [authGuard],
    loadComponent: () => import('./areas/inventory/inventory.page').then((m) => m.InventoryPage),
    title: 'Inventory',
  },
  {
    path: 'inventory/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./areas/item-detail/item-detail.page').then((m) => m.ItemDetailPage),
    title: 'Item · Inventory',
  },
  {
    path: 'sold',
    canActivate: [authGuard],
    loadComponent: () => import('./areas/sold/sold.page').then((m) => m.SoldPage),
    title: 'Sold · Inventory',
  },
  {
    path: 'statistics',
    canActivate: [authGuard],
    loadComponent: () => import('./areas/statistics/statistics.page').then((m) => m.StatisticsPage),
    title: 'Statistics · Inventory',
  },

  { path: '**', redirectTo: 'me' },
];
