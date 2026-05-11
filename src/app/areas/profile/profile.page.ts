import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../auth/services/auth.service';
import { roleLabel } from '../../auth/models/role.model';
import { MeApi, MyStatisticsResponse } from '../../api/me.api';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { MoneyPipe } from '../../modules/inventory/pipes/money.pipe';
import { ProfitClassPipe } from '../../modules/inventory/pipes/profit-class.pipe';

@Component({
  selector: 'invy-profile-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    StatCardComponent,
    MoneyPipe,
    ProfitClassPipe,
    DatePipe,
  ],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePage {
  private readonly auth = inject(AuthService);
  private readonly meApi = inject(MeApi);
  private readonly router = inject(Router);
  private readonly money = new MoneyPipe();

  readonly user = this.auth.user;
  readonly roleBadge = computed(() => roleLabel(this.auth.role()));
  readonly initial = computed(() => (this.auth.username() || '?')[0].toUpperCase());

  readonly stats = signal<MyStatisticsResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 5)  return 'Still up?';
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  });

  readonly ownedValueText = computed(() => formatByCurrency(this.stats()?.ownedValueByCurrency, this.money));
  readonly profitText     = computed(() => formatByCurrency(this.stats()?.realizedProfitByCurrency, this.money, { signed: true }));

  readonly profitToneClass = computed(() => {
    const rows = this.stats()?.realizedProfitByCurrency ?? [];
    if (rows.length === 0) return 'invy-muted';
    const total = rows.reduce((a, b) => a + b.amount, 0);
    if (total > 0) return 'invy-positive';
    if (total < 0) return 'invy-negative';
    return 'invy-muted';
  });

  constructor() {
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const s = await firstValueFrom(this.meApi.statistics());
      this.stats.set(s);
    } catch {
      this.error.set('Could not load your statistics.');
    } finally {
      this.loading.set(false);
    }
  }

  async logout(): Promise<void> {
    await this.auth.logout();
  }
}

function formatByCurrency(
  rows: readonly { currency: string; amount: number }[] | undefined,
  money: MoneyPipe,
  opts: { signed?: boolean } = {},
): string {
  if (!rows || rows.length === 0) return '—';
  const sorted = [...rows].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  return sorted
    .map((r) => {
      const formatted = money.transform(r.amount, r.currency);
      return opts.signed && r.amount > 0 ? `+${formatted}` : formatted;
    })
    .join('\n');
}
