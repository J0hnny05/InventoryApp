import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DOCUMENT } from '@angular/common';
import { filter, map, startWith } from 'rxjs';

import { UiStore } from './store/ui.store';
import { InventoryStore } from './store/inventory.store';
import { CategoriesStore } from './store/categories.store';
import { ExchangeRatesStore } from './store/exchange-rates.store';
import { AuthService } from './auth/services/auth.service';
import { roleLabel, UserRole } from './auth/models/role.model';

interface NavLink {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
  /** Roles allowed to see this link. `null` = everyone authenticated. */
  readonly roles?: readonly UserRole[];
}

@Component({
  selector: 'invy-app',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly breakpoints = inject(BreakpointObserver);
  private readonly uiStore = inject(UiStore);
  private readonly inventoryStore = inject(InventoryStore);
  private readonly categoriesStore = inject(CategoriesStore);
  private readonly ratesStore = inject(ExchangeRatesStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  private readonly allLinks: readonly NavLink[] = [
    { path: '/me',          label: 'Profile',    icon: 'person' },
    { path: '/inventory',   label: 'Inventory',  icon: 'inventory_2' },
    { path: '/sold',        label: 'Sold',       icon: 'sell' },
    { path: '/statistics',  label: 'Statistics', icon: 'insights' },
    { path: '/me/helpers',  label: 'Helpers',    icon: 'group',         roles: ['owner', 'admin'] },
    { path: '/admin/users', label: 'Users',      icon: 'admin_panel_settings', roles: ['admin'] },
  ];

  readonly user = this.auth.user;
  readonly roleLabel = computed(() => roleLabel(this.auth.role()));
  readonly initial = computed(() => (this.auth.username() || '?')[0].toUpperCase());

  /** Are we on an unauthenticated page (login/register)? Strip nav/profile then. */
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: '/' },
  );
  readonly isAnonRoute = computed(() => {
    const url = this.currentUrl();
    return url.startsWith('/login') || url.startsWith('/register');
  });

  readonly showShellChrome = computed(() => this.auth.isAuthenticated() && !this.isAnonRoute());

  readonly links = computed<readonly NavLink[]>(() => {
    const role = this.auth.role();
    if (!role) return [];
    return this.allLinks.filter((l) => !l.roles || l.roles.includes(role));
  });

  private readonly handset = toSignal(
    this.breakpoints.observe([Breakpoints.Handset, '(max-width: 720px)']),
    { initialValue: { matches: false, breakpoints: {} } },
  );

  readonly isMobile = computed(() => this.handset().matches);
  readonly isDark = computed(() => this.uiStore.theme() === 'dark');

  constructor() {
    // Theme follows the persisted preference.
    effect(() => {
      const isDark = this.isDark();
      const html = this.document.documentElement;
      if (isDark) html.classList.add('dark-theme');
      else html.classList.remove('dark-theme');
    });

    // Hydrate / reset shared stores in response to auth changes.
    effect(() => {
      const authed = this.auth.isAuthenticated();
      if (authed) {
        void this.uiStore.ensureLoaded();
        void this.categoriesStore.ensureLoaded();
        void this.inventoryStore.ensureLoaded();
        void this.ratesStore.ensureLoaded();
      } else {
        this.uiStore.reset();
        this.categoriesStore.reset();
        this.inventoryStore.reset();
        this.ratesStore.reset();
      }
    });
  }

  toggleTheme(): void {
    this.uiStore.setTheme(this.isDark() ? 'light' : 'dark');
  }

  async logout(): Promise<void> {
    await this.auth.logout();
  }

  onNavigate(): void {
    // closes the drawer on mobile when a link is clicked — handled via two-way binding in template
  }
}
