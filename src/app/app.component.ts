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
  template: `
    <mat-sidenav-container class="shell" autosize>
      <mat-sidenav class="shell__nav" mode="side" opened disableClose>
        <div class="brand">
          <span class="brand__mark" aria-hidden="true">⌬</span>
          <div class="brand__text">
            <span class="brand__name">Inventory</span>
            <span class="brand__sub">personal · client-side</span>
          </div>
        </div>

        <nav class="nav" aria-label="Primary">
          @for (link of links; track link.path) {
            <a
              class="nav__link"
              [routerLink]="link.path"
              routerLinkActive="is-active"
              [routerLinkActiveOptions]="{ exact: false }"
            >
              <mat-icon class="nav__icon">{{ link.icon }}</mat-icon>
              <span class="nav__label">{{ link.label }}</span>
            </a>
          }
        </nav>

        <footer class="shell__footer">
          <span class="invy-eyebrow">v0.1 · local-only</span>
        </footer>
      </mat-sidenav>

      <mat-sidenav-content class="shell__content">
        <router-outlet />
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      :host, .shell { display: block; height: 100%; }

      .shell__nav {
        width: 240px;
        border-right: 1px solid var(--mat-sys-outline-variant);
        background: var(--mat-sys-surface);
        padding: 20px 14px 16px;
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 8px 14px;
        border-bottom: 1px solid var(--mat-sys-outline-variant);
      }

      .brand__mark {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 14px;
        background: #DCE3DF;
        color: #2B2A28;
        font-size: 1.4rem;
      }

      .brand__text { display: flex; flex-direction: column; line-height: 1.1; }
      .brand__name { font-weight: 600; font-size: 1.05rem; letter-spacing: -0.01em; }
      .brand__sub  { font-size: 0.7rem; color: var(--mat-sys-on-surface-variant); }

      .nav { display: flex; flex-direction: column; gap: 2px; }

      .nav__link {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: 10px;
        color: var(--mat-sys-on-surface-variant);
        font-size: 0.92rem;
        font-weight: 500;
        cursor: pointer;
        transition: background 120ms ease, color 120ms ease;

        &:hover {
          background: #F4F1EA;
          color: var(--mat-sys-on-surface);
        }

        &.is-active {
          background: #DCE3DF;
          color: #2B2A28;
        }
      }

      .nav__icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        line-height: 20px;
      }

      .shell__footer { margin-top: auto; padding: 12px 8px; }

      .shell__content {
        background: var(--mat-sys-background);
        min-height: 100vh;
      }

      @media (max-width: 720px) {
        .shell__nav { width: 200px; }
      }
    `,
  ],
})
export class AppComponent {
  readonly links: readonly NavLink[] = [
    { path: '/dashboard',  label: 'Dashboard',   icon: 'dashboard' },
    { path: '/inventory',  label: 'Inventory',   icon: 'inventory_2' },
    { path: '/sold',       label: 'Sold',        icon: 'sell' },
    { path: '/statistics', label: 'Statistics',  icon: 'insights' },
  ];
}
