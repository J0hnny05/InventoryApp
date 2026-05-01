import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { DOCUMENT } from '@angular/common';
import { UiStore } from './store/ui.store';

interface NavLink {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
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
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly breakpoints = inject(BreakpointObserver);
  private readonly uiStore = inject(UiStore);
  private readonly document = inject(DOCUMENT);

  readonly links: readonly NavLink[] = [
    { path: '/dashboard',  label: 'Dashboard',  icon: 'dashboard' },
    { path: '/inventory',  label: 'Inventory',  icon: 'inventory_2' },
    { path: '/sold',       label: 'Sold',       icon: 'sell' },
    { path: '/statistics', label: 'Statistics', icon: 'insights' },
  ];

  private readonly handset = toSignal(
    this.breakpoints.observe([Breakpoints.Handset, '(max-width: 720px)']),
    { initialValue: { matches: false, breakpoints: {} } },
  );

  readonly isMobile = computed(() => this.handset().matches);
  readonly isDark = computed(() => this.uiStore.theme() === 'dark');

  constructor() {
    // Apply theme class to <html> element whenever theme changes
    effect(() => {
      const isDark = this.isDark();
      const htmlElement = this.document.documentElement;

      if (isDark) {
        htmlElement.classList.add('dark-theme');
      } else {
        htmlElement.classList.remove('dark-theme');
      }
    });
  }

  /** Toggle between light and dark theme */
  toggleTheme(): void {
    const newTheme = this.isDark() ? 'light' : 'dark';
    this.uiStore.setTheme(newTheme);
  }

  /** Close the drawer when the user picks a link on mobile. */
  onNavigate(): void {
    // No-op on desktop; on mobile the close happens via two-way [opened]
    // because the route change triggers it through user click on the backdrop.
  }
}
