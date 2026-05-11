import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { InventoryStore } from '../../store/inventory.store';
import { CategoriesStore } from '../../store/categories.store';
import { ExchangeRatesStore } from '../../store/exchange-rates.store';
import { UiStore } from '../../store/ui.store';
import { InventoryItem, daysOwned } from '../../modules/inventory/models/inventory-item.model';

import { MoneyPipe } from '../../modules/inventory/pipes/money.pipe';
import { DaysOwnedPipe } from '../../modules/inventory/pipes/days-owned.pipe';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { BarRowComponent } from '../../shared/components/bar-row/bar-row.component';

interface CategoryEurRow {
  readonly id: string;
  readonly label: string;
  readonly value: number;       // EUR amount
  readonly display: string;     // "1.234,56 €" formatted
  readonly count: number;
  readonly missing: number;     // items whose currency couldn't be converted
  readonly color: string;
}

interface UsageRow {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly display: string;
  readonly itemCount: number;
  readonly itemsWithUse: number;
  readonly color: string;
}

const TOP_LIMIT = 5;

/**
 * Idle-item rule (see `idle` below).
 *
 * An owned, non-pinned item is "idle" when *all three* hold:
 *  1. It's been owned long enough to fairly evaluate it (>= GRACE_DAYS).
 *  2. You haven't touched it recently — either it was never used, or the last
 *     use was >= STALE_DAYS ago.
 *  3. Its lifetime use rate is below MIN_USE_RATE (uses / month-owned).
 *
 * The "idle score" combines staleness with rarity so older-and-rarer items
 * float to the top. Pinned items are excluded — pinning is a deliberate
 * "I care about this" signal.
 */
const GRACE_DAYS = 30;          // brand-new items get a free pass
const STALE_DAYS = 60;          // "haven't touched it in two months"
const MIN_USE_RATE = 0.5;       // < 0.5 uses / 30-day month = under-used

interface IdleRow {
  readonly item: InventoryItem;
  readonly daysSinceTouch: number;
  readonly usesPerMonth: number;
  readonly reason: string;
  readonly score: number;
}

const EUR_FORMAT = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

@Component({
  selector: 'invy-statistics-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DecimalPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
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
  private readonly ratesStore = inject(ExchangeRatesStore);
  private readonly uiStore = inject(UiStore);
  private readonly money = new MoneyPipe();

  readonly defaultCurrency = this.uiStore.defaultCurrency;

  readonly ratesReady     = this.ratesStore.isReady;
  readonly ratesLoading   = this.ratesStore.loading;
  readonly ratesError     = this.ratesStore.error;
  readonly ratesUpdatedAt = this.ratesStore.lastUpdated;

  readonly ownedCount = computed(() => this.inventoryStore.owned().length);

  /** Total inventory value, fully converted to EUR. */
  readonly ownedValueEur = computed(() => {
    let total = 0;
    let missing = 0;
    for (const it of this.inventoryStore.owned()) {
      const eur = this.ratesStore.toEur(it.purchasePrice, it.currency);
      if (eur === null) missing += 1;
      else total += eur;
    }
    return { total, missing };
  });

  readonly ownedValueText = computed(() => {
    if (!this.ratesReady()) return '—';
    return EUR_FORMAT.format(this.ownedValueEur().total);
  });

  readonly ownedValueHint = computed(() => {
    const n = this.ownedCount();
    const missing = this.ownedValueEur().missing;
    const base = `${n} item${n === 1 ? '' : 's'}`;
    if (!this.ratesReady()) return `${base} · waiting for rates`;
    if (missing > 0) return `${base} · ${missing} not convertible`;
    return base;
  });

  /** Realized profit unchanged for now — kept per-currency multi-line. */
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
    return `${avg}`;
  });

  readonly avgDaysOwnedHint = computed(() => {
    const owned = this.inventoryStore.owned();
    if (owned.length === 0) return 'across owned items';
    return owned.length === 1 ? 'day across owned items' : 'days across owned items';
  });

  /** Value per category, fully normalized to EUR with 2 decimals. */
  readonly valueByCategoryEur = computed<readonly CategoryEurRow[]>(() => {
    if (!this.ratesReady()) return [];

    const map = new Map<string, { value: number; count: number; missing: number }>();
    for (const it of this.inventoryStore.owned()) {
      const slot = map.get(it.categoryId) ?? { value: 0, count: 0, missing: 0 };
      const eur = this.ratesStore.toEur(it.purchasePrice, it.currency);
      if (eur === null) slot.missing += 1;
      else slot.value += eur;
      slot.count += 1;
      map.set(it.categoryId, slot);
    }

    const rows: CategoryEurRow[] = [];
    for (const [id, slot] of map) {
      const cat = this.categoriesStore.byIdMap().get(id);
      rows.push({
        id,
        label: cat?.name ?? 'Uncategorized',
        value: slot.value,
        display: EUR_FORMAT.format(slot.value),
        count: slot.count,
        missing: slot.missing,
        color: cat?.color ?? '#B8C5C0',
      });
    }
    return rows.sort((a, b) => b.value - a.value);
  });

  /** Sum of all category values in EUR — used as the denominator for bar widths
   *  so each bar represents its share of the total inventory. */
  readonly valueTotalEur = computed(() =>
    this.valueByCategoryEur().reduce((s, r) => s + r.value, 0),
  );

  readonly valueGrandTotalEur = computed(() => EUR_FORMAT.format(this.valueTotalEur()));

  /** Pre-computed share-of-total for each row (0..100). */
  readonly valueShares = computed<ReadonlyMap<string, number>>(() => {
    const total = this.valueTotalEur();
    const out = new Map<string, number>();
    if (total <= 0) return out;
    for (const row of this.valueByCategoryEur()) {
      out.set(row.id, (row.value / total) * 100);
    }
    return out;
  });

  shareFor(rowId: string): number {
    return this.valueShares().get(rowId) ?? 0;
  }

  readonly ratesUpdatedLabel = computed(() => {
    const ts = this.ratesUpdatedAt();
    if (!ts) return '';
    return ts.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  });

  refreshRates(): void {
    this.ratesStore.refresh();
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

  readonly idle = computed<readonly IdleRow[]>(() => {
    const rows: IdleRow[] = [];
    for (const it of this.inventoryStore.owned()) {
      // Pinned items aren't candidates: the user explicitly cares about them.
      if (it.pinned) continue;

      const owned = daysOwned(it);
      if (owned < GRACE_DAYS) continue; // grace period — too new to judge

      const daysSinceTouch = daysSinceLastTouch(it);
      const usesPerMonth = owned > 0 ? (it.useCount / owned) * 30 : 0;

      const staleEnough = daysSinceTouch >= STALE_DAYS;
      const underUsed = usesPerMonth < MIN_USE_RATE;
      if (!staleEnough || !underUsed) continue;

      rows.push({
        item: it,
        daysSinceTouch,
        usesPerMonth,
        reason: idleReason(it, daysSinceTouch, usesPerMonth),
        // Higher = more idle. Staleness dominates; rarity breaks ties.
        score: daysSinceTouch / (1 + usesPerMonth),
      });
    }
    return rows.sort((a, b) => b.score - a.score).slice(0, TOP_LIMIT);
  });

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
}

/** Days since the item was last touched. "Touched" = recorded use; falls back
 *  to the purchase date when the item has never been used. */
function daysSinceLastTouch(it: InventoryItem): number {
  const anchorIso = it.lastUsedAt ?? `${it.purchaseDate}T00:00:00Z`;
  const ms = Date.now() - new Date(anchorIso).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

/** Human-readable explanation of why the item is on the idle list. */
function idleReason(it: InventoryItem, daysSinceTouch: number, usesPerMonth: number): string {
  if (it.useCount === 0) {
    return `Never used in ${daysSinceTouch}d`;
  }
  // Surface uses-per-year for items that have been used at least once — it's
  // a more relatable cadence than "0.18 uses/month".
  const perYear = Math.round(usesPerMonth * 12);
  return `${perYear}×/yr · last use ${daysSinceTouch}d ago`;
}
