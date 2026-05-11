import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';
import { InventorySort, Theme, UiState } from '../store/ui.store';

interface ServerUiPrefs {
  defaultCurrency: string;
  theme: string;          // 'light' | 'dark'
  inventorySort: string;  // 'pinnedRecent' | 'priceDesc' | 'priceAsc' | 'nameAsc'
  searchTerm: string;
  filterCategoryId: string | null;
}

@Injectable({ providedIn: 'root' })
export class UiPreferencesApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/ui-preferences`;

  get(): Observable<UiState> {
    return this.http.get<ServerUiPrefs>(this.base).pipe(map(toUi));
  }

  update(patch: Partial<UiState> & { search?: string; categoryFilter?: string | null }): Observable<UiState> {
    return this.http
      .put<ServerUiPrefs>(this.base, {
        defaultCurrency: patch.defaultCurrency ?? null,
        theme: patch.theme ?? null,
        inventorySort: patch.inventorySort ? sortToServer(patch.inventorySort) : null,
        searchTerm: patch.inventoryFilter?.search ?? null,
        filterCategoryId: patch.inventoryFilter?.categoryId ?? null,
      })
      .pipe(map(toUi));
  }
}

function toUi(s: ServerUiPrefs): UiState {
  return {
    defaultCurrency: s.defaultCurrency,
    theme: (s.theme as Theme) ?? 'light',
    inventorySort: sortFromServer(s.inventorySort),
    inventoryFilter: {
      search: s.searchTerm ?? '',
      categoryId: s.filterCategoryId ?? null,
    },
  };
}

function sortToServer(s: InventorySort): string {
  switch (s) {
    case 'pinned-recent': return 'pinnedRecent';
    case 'price-desc': return 'priceDesc';
    case 'price-asc': return 'priceAsc';
    case 'name-asc': return 'nameAsc';
  }
}

function sortFromServer(s: string): InventorySort {
  switch (s) {
    case 'priceDesc': return 'price-desc';
    case 'priceAsc': return 'price-asc';
    case 'nameAsc': return 'name-asc';
    default: return 'pinned-recent';
  }
}
