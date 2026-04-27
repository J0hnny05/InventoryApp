import { Injectable, Signal, computed, effect, inject, signal } from '@angular/core';
import { LocalStoragePersistenceService } from './persistence/local-storage.service';
import {
  InventoryItem,
  NewInventoryItemInput,
  profitOf,
} from '../modules/inventory/models/inventory-item.model';

const STORAGE_KEY = 'inventory.items';

@Injectable({ providedIn: 'root' })
export class InventoryStore {
  private readonly persistence = inject(LocalStoragePersistenceService);

  private readonly _items = signal<InventoryItem[]>(
    this.persistence.read<InventoryItem[]>(STORAGE_KEY) ?? [],
  );

  readonly items = this._items.asReadonly();

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

  /** Map of currency code -> sum of purchase prices for owned items. */
  readonly ownedValueByCurrency = computed<ReadonlyMap<string, number>>(() => {
    const map = new Map<string, number>();
    for (const it of this.owned()) {
      map.set(it.currency, (map.get(it.currency) ?? 0) + it.purchasePrice);
    }
    return map;
  });

  /** Map of currency code -> realized P&L for sold items. */
  readonly realizedProfitByCurrency = computed<ReadonlyMap<string, number>>(() => {
    const map = new Map<string, number>();
    for (const it of this.sold()) {
      map.set(it.currency, (map.get(it.currency) ?? 0) + profitOf(it));
    }
    return map;
  });

  /** Map of currency code -> total sale revenue for sold items. */
  readonly soldRevenueByCurrency = computed<ReadonlyMap<string, number>>(() => {
    const map = new Map<string, number>();
    for (const it of this.sold()) {
      map.set(it.currency, (map.get(it.currency) ?? 0) + (it.salePrice ?? 0));
    }
    return map;
  });

  /** Map of currency code -> total cost basis for sold items. */
  readonly soldCostByCurrency = computed<ReadonlyMap<string, number>>(() => {
    const map = new Map<string, number>();
    for (const it of this.sold()) {
      map.set(it.currency, (map.get(it.currency) ?? 0) + it.purchasePrice);
    }
    return map;
  });

  /** @deprecated currencies are now mixed; prefer realizedProfitByCurrency. */
  readonly totalRealizedProfit = computed(() =>
    this.sold().reduce((sum, i) => sum + profitOf(i), 0),
  );

  /** @deprecated currencies are now mixed; prefer soldRevenueByCurrency. */
  readonly totalSoldRevenue = computed(() =>
    this.sold().reduce((sum, i) => sum + (i.salePrice ?? 0), 0),
  );

  byId(id: string): Signal<InventoryItem | undefined> {
    return computed(() => this._items().find((i) => i.id === id));
  }

  add(input: NewInventoryItemInput): InventoryItem {
    const now = new Date().toISOString();
    const item: InventoryItem = {
      id: crypto.randomUUID(),
      pinned: false,
      status: 'owned',
      useCount: 0,
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
      ...input,
    };
    this._items.update((list) => [item, ...list]);
    return item;
  }

  update(id: string, patch: Partial<Omit<InventoryItem, 'id' | 'createdAt'>>): void {
    const now = new Date().toISOString();
    this._items.update((list) =>
      list.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: now } : i)),
    );
  }

  remove(id: string): void {
    this._items.update((list) => list.filter((i) => i.id !== id));
  }

  togglePin(id: string): void {
    const now = new Date().toISOString();
    this._items.update((list) =>
      list.map((i) => (i.id === id ? { ...i, pinned: !i.pinned, updatedAt: now } : i)),
    );
  }

  sell(id: string, salePrice: number, soldAt: string = new Date().toISOString().slice(0, 10)): void {
    this.update(id, { status: 'sold', salePrice, soldAt });
  }

  recordUse(id: string): void {
    const now = new Date().toISOString();
    this._items.update((list) =>
      list.map((i) =>
        i.id === id
          ? { ...i, useCount: i.useCount + 1, lastUsedAt: now, updatedAt: now }
          : i,
      ),
    );
  }

  recordView(id: string): void {
    this._items.update((list) =>
      list.map((i) => (i.id === id ? { ...i, viewCount: i.viewCount + 1 } : i)),
    );
  }

  /** Replace the entire collection (used after an import). */
  replaceAll(items: InventoryItem[]): void {
    this._items.set(items);
  }

  constructor() {
    effect(() => {
      this.persistence.write(STORAGE_KEY, this._items());
    });
  }
}
