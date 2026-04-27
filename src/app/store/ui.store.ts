import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { LocalStoragePersistenceService } from './persistence/local-storage.service';

export type Theme = 'light' | 'dark';
export type InventorySort = 'pinned-recent' | 'price-desc' | 'price-asc' | 'name-asc';

export interface InventoryFilter {
  search: string;
  categoryId: string | null;
}

export interface UiState {
  defaultCurrency: string;
  theme: Theme;
  inventorySort: InventorySort;
  inventoryFilter: InventoryFilter;
}

const STORAGE_KEY = 'ui';

/** Default currency (changeable in the Add/Edit item form). */
export const DEFAULT_CURRENCY = 'MDL';

const INITIAL: UiState = {
  defaultCurrency: DEFAULT_CURRENCY,
  theme: 'light',
  inventorySort: 'pinned-recent',
  inventoryFilter: { search: '', categoryId: null },
};

@Injectable({ providedIn: 'root' })
export class UiStore {
  private readonly persistence = inject(LocalStoragePersistenceService);

  private readonly _state = signal<UiState>({
    ...INITIAL,
    ...(this.persistence.read<Partial<UiState>>(STORAGE_KEY) ?? {}),
    inventoryFilter: {
      ...INITIAL.inventoryFilter,
      ...(this.persistence.read<UiState>(STORAGE_KEY)?.inventoryFilter ?? {}),
    },
  });

  readonly state           = this._state.asReadonly();
  readonly defaultCurrency = computed(() => this._state().defaultCurrency);
  readonly theme           = computed(() => this._state().theme);
  readonly inventorySort   = computed(() => this._state().inventorySort);
  readonly inventoryFilter = computed(() => this._state().inventoryFilter);

  setCurrency(code: string): void {
    this._state.update((s) => ({ ...s, defaultCurrency: code.toUpperCase() }));
  }

  setTheme(theme: Theme): void {
    this._state.update((s) => ({ ...s, theme }));
  }

  setSort(sort: InventorySort): void {
    this._state.update((s) => ({ ...s, inventorySort: sort }));
  }

  setSearch(search: string): void {
    this._state.update((s) => ({
      ...s,
      inventoryFilter: { ...s.inventoryFilter, search },
    }));
  }

  setCategoryFilter(categoryId: string | null): void {
    this._state.update((s) => ({
      ...s,
      inventoryFilter: { ...s.inventoryFilter, categoryId },
    }));
  }

  resetFilters(): void {
    this._state.update((s) => ({ ...s, inventoryFilter: { search: '', categoryId: null } }));
  }

  constructor() {
    effect(() => {
      this.persistence.write(STORAGE_KEY, this._state());
    });
  }
}
