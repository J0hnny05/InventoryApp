import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { UiPreferencesApi } from '../api/ui-preferences.api';

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

/** Default currency (changeable in the Add/Edit item form). */
export const DEFAULT_CURRENCY = 'MDL';

const INITIAL: UiState = {
  defaultCurrency: DEFAULT_CURRENCY,
  theme: 'light',
  inventorySort: 'pinned-recent',
  inventoryFilter: { search: '', categoryId: null },
};

/**
 * Per-user UI preferences (currency, theme, inventory sort + filter). Hydrated
 * once from `/api/ui-preferences` after login. Mutations are persisted by
 * scheduling a debounced PUT — local state updates immediately so the UI is
 * responsive even before the server round-trip finishes.
 */
@Injectable({ providedIn: 'root' })
export class UiStore {
  private readonly api = inject(UiPreferencesApi);

  private readonly _state = signal<UiState>(INITIAL);
  private hydrated = false;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  readonly state           = this._state.asReadonly();
  readonly defaultCurrency = computed(() => this._state().defaultCurrency);
  readonly theme           = computed(() => this._state().theme);
  readonly inventorySort   = computed(() => this._state().inventorySort);
  readonly inventoryFilter = computed(() => this._state().inventoryFilter);

  async ensureLoaded(): Promise<void> {
    if (this.hydrated) return;
    try {
      const server = await firstValueFrom(this.api.get());
      this._state.set(server);
      this.hydrated = true;
    } catch {
      // Stay on defaults — the user can still operate the app locally.
    }
  }

  reset(): void {
    this._state.set(INITIAL);
    this.hydrated = false;
  }

  setCurrency(code: string): void {
    this._state.update((s) => ({ ...s, defaultCurrency: code.toUpperCase() }));
    this.queueSave();
  }

  setTheme(theme: Theme): void {
    this._state.update((s) => ({ ...s, theme }));
    this.queueSave();
  }

  setSort(sort: InventorySort): void {
    this._state.update((s) => ({ ...s, inventorySort: sort }));
    this.queueSave();
  }

  setSearch(search: string): void {
    this._state.update((s) => ({ ...s, inventoryFilter: { ...s.inventoryFilter, search } }));
    this.queueSave();
  }

  setCategoryFilter(categoryId: string | null): void {
    this._state.update((s) => ({ ...s, inventoryFilter: { ...s.inventoryFilter, categoryId } }));
    this.queueSave();
  }

  resetFilters(): void {
    this._state.update((s) => ({ ...s, inventoryFilter: { search: '', categoryId: null } }));
    this.queueSave();
  }

  private queueSave(): void {
    if (!this.hydrated) return; // skip until we know the server-side baseline
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.api.update(this._state()).subscribe({ error: () => void 0 });
    }, 350);
  }
}
