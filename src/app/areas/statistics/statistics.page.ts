import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

import { InventoryStore } from '../../store/inventory.store';
import { CategoriesStore } from '../../store/categories.store';
import { UiStore } from '../../store/ui.store';
import { InventoryItem, daysOwned } from '../../modules/inventory/models/inventory-item.model';
import { Category } from '../../modules/categories/models/category.model';

import { MoneyPipe } from '../../modules/inventory/pipes/money.pipe';
import { DaysOwnedPipe } from '../../modules/inventory/pipes/days-owned.pipe';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { BarRowComponent } from '../../shared/components/bar-row/bar-row.component';

interface ValueRow {
  readonly id: string;          // unique key per (category, currency)
  readonly label: string;
  readonly currency: string;
  readonly value: number;
  readonly display: string;
  readonly count: number;
  readonly color: string;
}

interface UsageRow {
  readonly id: string;
  readonly label: string;
  readonly value: number;          // sum of useCount across the category
  readonly display: string;
  readonly itemCount: number;
  readonly itemsWithUse: number;
  readonly color: string;
}

const TOP_LIMIT = 5;

@Component({
  selector: 'invy-statistics-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatCardModule,
    PageHeaderComponent,
    StatCardComponent,
    BarRowComponent,
    DaysOwnedPipe,
  ],
  templateUrl: './statistics.page.html',
  styleUrl: './statistics.page.scss',
})
export class StatisticsPage {
  private readonly inventoryStore = inject(InventoryStore);
  private readonly categoriesStore = inject(CategoriesStore);
  private readonly uiStore = inject(UiStore);
  private readonly money = new MoneyPipe();

  readonly defaultCurrency = this.uiStore.defaultCurrency;

  readonly ownedCount  = computed(() => this.inventoryStore.owned().length);

  readonly ownedValueText = computed(() =>
    this.formatByCurrency(this.inventoryStore.ownedValueByCurrency()),
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

  readonly itemsCountHint = computed(() => {
    const n = this.ownedCount();
    return `${n} item${n === 1 ? '' : 's'}`;
  });

  readonly totalUses = computed(() =>
    this.inventoryStore.items().reduce((s, i) => s + i.useCount, 0),
  );

  readonly usesHint = computed(() => {
    const used = this.inventoryStore.items().filter((i) => i.useCount > 0).length;
    const all = this.inventoryStore.items().length;
    if (all === 0) return 'no items yet';
    return `${used} of ${all} items used`;
  });

  readonly avgDaysOwned = computed(() => {
    const owned = this.inventoryStore.owned();
    if (owned.length === 0) return '—';
    const total = owned.reduce((s, i) => s + daysOwned(i), 0);
    const avg = Math.round(total / owned.length);
    if (avg < 30) return `${avg}d`;
    const months = Math.round(avg / 30);
    if (months < 12) return `${months}mo`;
    return `${(avg / 365).toFixed(1)}y`;
  });

  /** Owned value broken down per (category, currency) — bars are scaled within
   *  their own currency group so totals across currencies aren't compared. */
  readonly valueByCategory = computed<readonly ValueRow[]>(() => {
    const map = new Map<string, { value: number; count: number; categoryId: string; currency: string }>();
    for (const it of this.inventoryStore.owned()) {
      const key = `${it.categoryId}|${it.currency}`;
      const slot = map.get(key) ?? { value: 0, count: 0, categoryId: it.categoryId, currency: it.currency };
      slot.value += it.purchasePrice;
      slot.count += 1;
      map.set(key, slot);
    }
    const rows: ValueRow[] = [];
    for (const [key, slot] of map) {
      const cat = this.categoriesStore.byIdMap().get(slot.categoryId);
      rows.push({
        id: key,
        label: cat?.name ?? 'Uncategorized',
        currency: slot.currency,
        value: slot.value,
        display: this.money.transform(slot.value, slot.currency),
        count: slot.count,
        color: cat?.color ?? '#B8C5C0',
      });
    }
    return rows.sort((a, b) => {
      // group by currency first (alphabetical), then by value desc within
      if (a.currency !== b.currency) return a.currency.localeCompare(b.currency);
      return b.value - a.value;
    });
  });

  /** Per-currency max so each currency's bars are scaled independently. */
  readonly valueMaxByCurrency = computed<ReadonlyMap<string, number>>(() => {
    const max = new Map<string, number>();
    for (const row of this.valueByCategory()) {
      max.set(row.currency, Math.max(max.get(row.currency) ?? 0, row.value));
    }
    return max;
  });

  valueMaxFor(currency: string): number {
    return this.valueMaxByCurrency().get(currency) ?? 0;
  }

  readonly usageByCategory = computed<readonly UsageRow[]>(() => {
    const map = new Map<string, { uses: number; itemCount: number; itemsWithUse: number }>();
    for (const it of this.inventoryStore.items()) {
      const slot = map.get(it.categoryId) ?? { uses: 0, itemCount: 0, itemsWithUse: 0 };
      slot.uses += it.useCount;
      slot.itemCount += 1;
      if (it.useCount > 0) slot.itemsWithUse += 1;
      map.set(it.categoryId, slot);
    }
    const rows: UsageRow[] = [];
    for (const [id, slot] of map) {
      if (slot.uses === 0) continue;
      const cat = this.categoriesStore.byIdMap().get(id);
      rows.push({
        id,
        label: cat?.name ?? 'Uncategorized',
        value: slot.uses,
        display: `${slot.uses}`,
        itemCount: slot.itemCount,
        itemsWithUse: slot.itemsWithUse,
        color: cat?.color ?? '#C8B5C4',
      });
    }
    return rows.sort((a, b) => b.value - a.value);
  });

  readonly usageMax = computed(() =>
    this.usageByCategory().reduce((m, r) => Math.max(m, r.value), 0),
  );

  readonly mostUsed = computed<readonly InventoryItem[]>(() =>
    [...this.inventoryStore.items()]
      .filter((i) => i.useCount > 0)
      .sort((a, b) => b.useCount - a.useCount)
      .slice(0, TOP_LIMIT),
  );

  readonly idle = computed<readonly InventoryItem[]>(() =>
    [...this.inventoryStore.owned()]
      .filter((i) => i.useCount === 0)
      .sort((a, b) => daysOwned(b) - daysOwned(a))
      .slice(0, TOP_LIMIT),
  );

  resolveCategory(id: string): string {
    return this.categoriesStore.resolveName(id);
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

  /** Make the unused Category type explicit so the imported type is preserved
   *  even if the template never references it directly. */
  protected readonly _typeGuard?: Category;
}
