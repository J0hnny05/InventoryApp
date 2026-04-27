import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { InventoryStore } from '../../store/inventory.store';
import { CategoriesStore } from '../../store/categories.store';
import { UiStore } from '../../store/ui.store';
import { InventoryItem, profitOf, roiOf } from '../../modules/inventory/models/inventory-item.model';
import { MoneyPipe } from '../../modules/inventory/pipes/money.pipe';
import { ProfitClassPipe } from '../../modules/inventory/pipes/profit-class.pipe';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

interface CategoryRow {
  readonly id: string;          // unique key per (category, currency)
  readonly categoryId: string;
  readonly name: string;
  readonly currency: string;
  readonly count: number;
  readonly profit: number;
}

@Component({
  selector: 'invy-sold-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    PageHeaderComponent,
    StatCardComponent,
    EmptyStateComponent,
    MoneyPipe,
    ProfitClassPipe,
  ],
  templateUrl: './sold.page.html',
  styleUrl: './sold.page.scss',
})
export class SoldPage {
  private readonly inventoryStore = inject(InventoryStore);
  private readonly categoriesStore = inject(CategoriesStore);
  private readonly uiStore = inject(UiStore);
  private readonly money = new MoneyPipe();

  readonly defaultCurrency = this.uiStore.defaultCurrency;

  readonly items = this.inventoryStore.soldOrdered;
  readonly soldCount = computed(() => this.inventoryStore.sold().length);

  readonly totalRevenueText = computed(() =>
    this.formatByCurrency(this.inventoryStore.soldRevenueByCurrency()),
  );
  readonly totalCostText = computed(() =>
    this.formatByCurrency(this.inventoryStore.soldCostByCurrency()),
  );
  readonly totalProfitText = computed(() =>
    this.formatByCurrency(this.inventoryStore.realizedProfitByCurrency(), { signed: true }),
  );

  readonly profitToneClass = computed(() => {
    const sums = Array.from(this.inventoryStore.realizedProfitByCurrency().values());
    if (sums.length === 0) return 'invy-muted';
    const total = sums.reduce((a, b) => a + b, 0);
    if (total > 0) return 'invy-positive';
    if (total < 0) return 'invy-negative';
    return 'invy-muted';
  });

  readonly profitHint = computed(() => {
    const count = this.soldCount();
    if (count === 0) return 'Nothing sold yet';
    return `${count} sale${count === 1 ? '' : 's'}`;
  });

  /** Profit grouped per (category, currency) — never sums across currencies. */
  readonly byCategory = computed<readonly CategoryRow[]>(() => {
    const map = new Map<string, { count: number; profit: number }>();
    for (const it of this.inventoryStore.sold()) {
      const key = `${it.categoryId}|${it.currency}`;
      const slot = map.get(key) ?? { count: 0, profit: 0 };
      slot.count += 1;
      slot.profit += profitOf(it);
      map.set(key, slot);
    }
    const rows: CategoryRow[] = [];
    for (const [key, slot] of map) {
      const [categoryId, currency] = key.split('|');
      rows.push({
        id: key,
        categoryId,
        name: this.categoriesStore.resolveName(categoryId),
        currency,
        count: slot.count,
        profit: slot.profit,
      });
    }
    return rows.sort((a, b) => Math.abs(b.profit) - Math.abs(a.profit));
  });

  resolveCategory(id: string): string {
    return this.categoriesStore.resolveName(id);
  }

  profit(item: InventoryItem): number {
    return profitOf(item);
  }

  roi(item: InventoryItem): number {
    return roiOf(item);
  }

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
}
