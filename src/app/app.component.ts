import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';

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

  /** Close the drawer when the user picks a link on mobile. */
  onNavigate(): void {
    // No-op on desktop; on mobile the close happens via two-way [opened]
    // because the route change triggers it through user click on the backdrop.
  }
}
