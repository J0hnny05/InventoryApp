import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { InventoryStore } from '../../store/inventory.store';
import { CategoriesStore } from '../../store/categories.store';
import { UiStore } from '../../store/ui.store';
import { InventoryItem, profitOf } from '../../modules/inventory/models/inventory-item.model';
import { MoneyPipe } from '../../modules/inventory/pipes/money.pipe';
import { ProfitClassPipe } from '../../modules/inventory/pipes/profit-class.pipe';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import {
  ItemFormDialogComponent,
  ItemFormDialogResult,
} from '../../modules/inventory/dialogs/item-form-dialog/item-form-dialog.component';

const RECENT_LIMIT = 5;

@Component({
  selector: 'invy-dashboard-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    StatCardComponent,
    MoneyPipe,
    ProfitClassPipe,
  ],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage {
  private readonly inventoryStore = inject(InventoryStore);
  private readonly categoriesStore = inject(CategoriesStore);
  private readonly uiStore = inject(UiStore);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  private readonly money = new MoneyPipe();

  readonly defaultCurrency = this.uiStore.defaultCurrency;
  readonly ownedCount = computed(() => this.inventoryStore.owned().length);
  readonly soldCount  = computed(() => this.inventoryStore.sold().length);

  readonly ownedValueText = computed(() =>
    this.formatByCurrency(this.inventoryStore.ownedValueByCurrency()),
  );

  readonly totalProfitText = computed(() =>
    this.formatByCurrency(this.inventoryStore.realizedProfitByCurrency(), { signed: true }),
  );

  /** Sign of the dominant-currency profit, used to color the value tone. */
  readonly profitToneClass = computed(() => {
    const sums = Array.from(this.inventoryStore.realizedProfitByCurrency().values());
    if (sums.length === 0) return 'invy-muted';
    const total = sums.reduce((a, b) => a + b, 0);
    if (total > 0) return 'invy-positive';
    if (total < 0) return 'invy-negative';
    return 'invy-muted';
  });

  readonly greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 5)  return 'Still up?';
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  });

  readonly pinnedHint = computed(() => {
    const n = this.inventoryStore.pinned().length;
    return n === 0 ? '0 pinned' : `${n} pinned`;
  });

  readonly profitHint = computed(() => {
    const n = this.soldCount();
    if (n === 0) return 'Nothing sold yet';
    return `${n} sale${n === 1 ? '' : 's'}`;
  });

  /** Render a multi-currency total as one line per currency, sorted by magnitude. */
  private formatByCurrency(
    map: ReadonlyMap<string, number>,
    opts: { signed?: boolean } = {},
  ): string {
    if (map.size === 0) return '—';
    const rows = Array.from(map, ([currency, amount]) => ({ currency, amount }))
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    return rows
      .map((r) => {
        const formatted = this.money.transform(r.amount, r.currency);
        return opts.signed && r.amount > 0 ? `+${formatted}` : formatted;
      })
      .join('\n');
  }

  readonly recentlyAdded = computed<readonly InventoryItem[]>(() =>
    [...this.inventoryStore.owned()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, RECENT_LIMIT),
  );

  readonly recentlySold = computed<readonly InventoryItem[]>(() =>
    [...this.inventoryStore.sold()]
      .sort((a, b) => (b.soldAt ?? '').localeCompare(a.soldAt ?? ''))
      .slice(0, RECENT_LIMIT),
  );

  resolveCategory(id: string): string {
    return this.categoriesStore.resolveName(id);
  }

  profit(it: InventoryItem): number {
    return profitOf(it);
  }

  async goAdd(): Promise<void> {
    const ref = this.dialog.open<ItemFormDialogComponent, unknown, ItemFormDialogResult | undefined>(
      ItemFormDialogComponent,
      { data: {}, autoFocus: 'first-tabbable' },
    );
    const result = await firstValueFrom(ref.afterClosed());
    if (result) {
      const created = this.inventoryStore.add(result);
      this.router.navigate(['/inventory', created.id]);
    }
  }
}
