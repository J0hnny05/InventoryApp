import { Injectable, Signal, computed, effect, inject, signal } from '@angular/core';
import { LocalStoragePersistenceService } from './persistence/local-storage.service';
import {
  Category,
  DEFAULT_CATEGORIES,
} from '../modules/categories/models/category.model';

const STORAGE_KEY = 'categories';

@Injectable({ providedIn: 'root' })
export class CategoriesStore {
  private readonly persistence = inject(LocalStoragePersistenceService);

  private readonly _categories = signal<Category[]>(
    this.persistence.read<Category[]>(STORAGE_KEY) ?? [...DEFAULT_CATEGORIES],
  );

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

  add(input: { name: string; color?: string; icon?: string }): Category {
    const category: Category = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      builtIn: false,
      color: input.color,
      icon: input.icon ?? 'category',
    };
    this._categories.update((list) => [...list, category]);
    return category;
  }

  rename(id: string, name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    this._categories.update((list) =>
      list.map((c) => (c.id === id ? { ...c, name: trimmed } : c)),
    );
  }

  /** Built-in categories cannot be removed — only user-added ones. */
  remove(id: string): boolean {
    const target = this._categories().find((c) => c.id === id);
    if (!target || target.builtIn) return false;
    this._categories.update((list) => list.filter((c) => c.id !== id));
    return true;
  }

  replaceAll(categories: Category[]): void {
    this._categories.set(categories);
  }

  constructor() {
    effect(() => {
      this.persistence.write(STORAGE_KEY, this._categories());
    });
  }
}
