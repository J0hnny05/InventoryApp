import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { InventoryApi } from '../api/inventory.api';
import {
  InventoryItem,
  NewInventoryItemInput,
  profitOf,
} from '../modules/inventory/models/inventory-item.model';

/**
 * In-memory cache of the authenticated user's inventory. Hydrated from `/api/items`
 * on first injection (or after login) and reconciled with every server response.
 * Computed views (totals, pinned, sold) keep their old shape so existing pages
 * don't need to be reworked.
 */
@Injectable({ providedIn: 'root' })
export class InventoryStore {
  private readonly api = inject(InventoryApi);

  private readonly _items = signal<InventoryItem[]>([]);
  private readonly _loading = signal(false);
  private readonly _total = signal(0);
  private hydrated = false;

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly total = this._total.asReadonly();

  readonly owned  = computed(() => this._items().filter((i) => i.status === 'owned'));
  readonly sold   = computed(() => this._items().filter((i) => i.status === 'sold'));
  readonly pinned = computed(() => this.owned().filter((i) => i.pinned));

  readonly ownedOrdered = computed(() => {
    const list = [...this.owned()];
    return list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  });

  readonly soldOrdered = computed(() =>
    [...this.sold()].sort((a, b) => (b.soldAt ?? '').localeCompare(a.soldAt ?? '')),
  );

  /** @deprecated currencies are now mixed; prefer ownedValueByCurrency. */
  readonly totalOwnedValue = computed(() =>
    this.owned().reduce((sum, i) => sum + i.purchasePrice, 0),
  );

  readonly ownedValueByCurrency = computed<ReadonlyMap<string, number>>(() => {
    const map = new Map<string, number>();
    for (const it of this.owned()) {
      map.set(it.currency, (map.get(it.currency) ?? 0) + it.purchasePrice);
    }
    return map;
  });

  readonly realizedProfitByCurrency = computed<ReadonlyMap<string, number>>(() => {
    const map = new Map<string, number>();
    for (const it of this.sold()) {
      map.set(it.currency, (map.get(it.currency) ?? 0) + profitOf(it));
    }
    return map;
  });

  readonly soldRevenueByCurrency = computed<ReadonlyMap<string, number>>(() => {
    const map = new Map<string, number>();
    for (const it of this.sold()) {
      map.set(it.currency, (map.get(it.currency) ?? 0) + (it.salePrice ?? 0));
    }
    return map;
  });

  readonly soldCostByCurrency = computed<ReadonlyMap<string, number>>(() => {
    const map = new Map<string, number>();
    for (const it of this.sold()) {
      map.set(it.currency, (map.get(it.currency) ?? 0) + it.purchasePrice);
    }
    return map;
  });

  readonly totalRealizedProfit = computed(() =>
    this.sold().reduce((sum, i) => sum + profitOf(i), 0),
  );

  readonly totalSoldRevenue = computed(() =>
    this.sold().reduce((sum, i) => sum + (i.salePrice ?? 0), 0),
  );

  byId(id: string): Signal<InventoryItem | undefined> {
    return computed(() => this._items().find((i) => i.id === id));
  }

  // ── hydration ───────────────────────────────────────────────────────────

  /** Fetch the full list once. Safe to call repeatedly — only the first call hits the server. */
  async ensureLoaded(): Promise<void> {
    if (this.hydrated || this._loading()) return;
    await this.reload();
  }

  /** Force a fresh fetch from the server. */
  async reload(): Promise<void> {
    this._loading.set(true);
    try {
      // Pull a large page — the personal inventory is bounded and the page itself
      // can request narrower slices through `InventoryApi.list` directly.
      const page = await firstValueFrom(this.api.list({ skip: 0, take: 200 }));
      this._items.set([...page.items]);
      this._total.set(page.total);
      this.hydrated = true;
    } finally {
      this._loading.set(false);
    }
  }

  /** Clear cached state on logout. */
  reset(): void {
    this._items.set([]);
    this._total.set(0);
    this.hydrated = false;
  }

  // ── mutators ────────────────────────────────────────────────────────────

  async add(input: NewInventoryItemInput): Promise<InventoryItem> {
    const created = await firstValueFrom(this.api.create(input));
    this._items.update((list) => [created, ...list]);
    this._total.update((t) => t + 1);
    return created;
  }

  async update(id: string, patch: Partial<InventoryItem>): Promise<InventoryItem | undefined> {
    const current = this._items().find((i) => i.id === id);
    if (!current) return undefined;
    const updated = await firstValueFrom(this.api.update(id, { ...current, ...patch }));
    this.replaceLocal(updated);
    return updated;
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.api.remove(id));
    this._items.update((list) => list.filter((i) => i.id !== id));
    this._total.update((t) => Math.max(0, t - 1));
  }

  async togglePin(id: string): Promise<void> {
    const updated = await firstValueFrom(this.api.togglePin(id));
    this.replaceLocal(updated);
  }

  async sell(id: string, salePrice: number, soldAt: string = isoDate()): Promise<void> {
    const updated = await firstValueFrom(this.api.sell(id, salePrice, soldAt));
    this.replaceLocal(updated);
  }

  async recordUse(id: string): Promise<void> {
    const updated = await firstValueFrom(this.api.recordUse(id));
    this.replaceLocal(updated);
  }

  async recordView(id: string): Promise<void> {
    const updated = await firstValueFrom(this.api.recordView(id));
    this.replaceLocal(updated);
  }

  private replaceLocal(item: InventoryItem): void {
    this._items.update((list) => list.map((i) => (i.id === item.id ? item : i)));
  }
}

function isoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
