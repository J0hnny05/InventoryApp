import { ChangeDetectionStrategy, Component } from '@angular/core';
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
  readonly links: readonly NavLink[] = [
    { path: '/dashboard',  label: 'Dashboard',  icon: 'dashboard' },
    { path: '/inventory',  label: 'Inventory',  icon: 'inventory_2' },
    { path: '/sold',       label: 'Sold',       icon: 'sell' },
    { path: '/statistics', label: 'Statistics', icon: 'insights' },
  ];
}
