import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { CategoriesApi } from '../api/categories.api';
import { Category, DEFAULT_CATEGORIES } from '../modules/categories/models/category.model';

/**
 * Cache of built-in (global) categories plus the current owner's user-defined ones.
 * Hydrated from the server on first injection; mutations call the API and update
 * the local signal on success.
 */
@Injectable({ providedIn: 'root' })
export class CategoriesStore {
  private readonly api = inject(CategoriesApi);

  private readonly _categories = signal<Category[]>([...DEFAULT_CATEGORIES]);
  private hydrated = false;

  readonly categories = this._categories.asReadonly();

  readonly byIdMap = computed(() => {
    const map = new Map<string, Category>();
    for (const c of this._categories()) map.set(c.id, c);
    return map;
  });

  byId(id: string): Signal<Category | undefined> {
    return computed(() => this.byIdMap().get(id));
  }

  resolveName(id: string): string {
    return this.byIdMap().get(id)?.name ?? 'Uncategorized';
  }

  async ensureLoaded(): Promise<void> {
    if (this.hydrated) return;
    await this.reload();
  }

  async reload(): Promise<void> {
    const page = await firstValueFrom(this.api.list(0, 200));
    this._categories.set([...page.items]);
    this.hydrated = true;
  }

  reset(): void {
    this._categories.set([...DEFAULT_CATEGORIES]);
    this.hydrated = false;
  }

  async add(input: { name: string; color?: string; icon?: string }): Promise<Category> {
    const created = await firstValueFrom(this.api.create(input));
    this._categories.update((list) => [...list, created]);
    return created;
  }

  async rename(id: string, name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) return;
    const updated = await firstValueFrom(this.api.rename(id, trimmed));
    this._categories.update((list) => list.map((c) => (c.id === id ? updated : c)));
  }

  async remove(id: string): Promise<boolean> {
    const target = this._categories().find((c) => c.id === id);
    if (!target || target.builtIn) return false;
    await firstValueFrom(this.api.remove(id));
    this._categories.update((list) => list.filter((c) => c.id !== id));
    return true;
  }
}
