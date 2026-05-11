import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  InventoryItem,
  ItemCondition,
  ItemStatus,
  NewInventoryItemInput,
} from '../modules/inventory/models/inventory-item.model';
import { InventorySort } from '../store/ui.store';
import { PagedResult } from './paged-result.model';

/** Server response shape — kept private so the rest of the app only sees `InventoryItem`. */
interface ServerInventoryItem {
  id: string;
  name: string;
  categoryId: string;
  purchasePrice: number;
  purchaseDate: string;     // yyyy-MM-dd
  currency: string;
  description: string | null;
  brand: string | null;
  condition: string | null; // 'new' | 'used' | 'refurbished' | null
  location: string | null;
  tags: readonly string[];
  pinned: boolean;
  status: string;           // 'owned' | 'sold'
  soldAt: string | null;
  salePrice: number | null;
  useCount: number;
  lastUsedAt: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  profit: number;
  roi: number;
  daysOwned: number;
}

export interface InventoryListParams {
  search?: string;
  categoryId?: string | null;
  status?: ItemStatus;
  sort?: InventorySort;
  skip?: number;
  take?: number;
}

@Injectable({ providedIn: 'root' })
export class InventoryApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/items`;

  list(params: InventoryListParams = {}): Observable<PagedResult<InventoryItem>> {
    let p = new HttpParams();
    if (params.search) p = p.set('search', params.search);
    if (params.categoryId) p = p.set('categoryId', params.categoryId);
    if (params.status) p = p.set('status', params.status);
    if (params.sort) p = p.set('sort', sortToServer(params.sort));
    if (params.skip != null) p = p.set('skip', params.skip);
    if (params.take != null) p = p.set('take', params.take);
    return this.http
      .get<PagedResult<ServerInventoryItem>>(this.base, { params: p })
      .pipe(map((r) => ({ ...r, items: r.items.map(toItem) })));
  }

  get(id: string): Observable<InventoryItem> {
    return this.http.get<ServerInventoryItem>(`${this.base}/${id}`).pipe(map(toItem));
  }

  create(input: NewInventoryItemInput): Observable<InventoryItem> {
    return this.http.post<ServerInventoryItem>(this.base, toCreatePayload(input)).pipe(map(toItem));
  }

  update(id: string, patch: Partial<InventoryItem>): Observable<InventoryItem> {
    // Server PUT expects the full editable shape — caller must pass a full item.
    return this.http.put<ServerInventoryItem>(`${this.base}/${id}`, toUpdatePayload(patch)).pipe(map(toItem));
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  togglePin(id: string): Observable<InventoryItem> {
    return this.http.post<ServerInventoryItem>(`${this.base}/${id}/pin`, {}).pipe(map(toItem));
  }

  sell(id: string, salePrice: number, soldAt: string): Observable<InventoryItem> {
    return this.http
      .post<ServerInventoryItem>(`${this.base}/${id}/sell`, { salePrice, soldAt })
      .pipe(map(toItem));
  }

  recordUse(id: string): Observable<InventoryItem> {
    return this.http.post<ServerInventoryItem>(`${this.base}/${id}/use`, {}).pipe(map(toItem));
  }

  recordView(id: string): Observable<InventoryItem> {
    return this.http.post<ServerInventoryItem>(`${this.base}/${id}/view`, {}).pipe(map(toItem));
  }
}

function toItem(s: ServerInventoryItem): InventoryItem {
  return {
    id: s.id,
    name: s.name,
    categoryId: s.categoryId,
    purchasePrice: s.purchasePrice,
    purchaseDate: s.purchaseDate,
    currency: s.currency,
    description: s.description ?? undefined,
    brand: s.brand ?? undefined,
    condition: (s.condition as ItemCondition | null) ?? undefined,
    location: s.location ?? undefined,
    tags: s.tags ?? [],
    pinned: s.pinned,
    status: s.status as ItemStatus,
    soldAt: s.soldAt ?? undefined,
    salePrice: s.salePrice ?? undefined,
    useCount: s.useCount,
    lastUsedAt: s.lastUsedAt ?? undefined,
    viewCount: s.viewCount,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

function toCreatePayload(i: NewInventoryItemInput) {
  return {
    name: i.name,
    categoryId: i.categoryId,
    purchasePrice: i.purchasePrice,
    purchaseDate: i.purchaseDate,
    currency: i.currency,
    description: i.description ?? null,
    brand: i.brand ?? null,
    condition: i.condition ?? null,
    location: i.location ?? null,
    tags: i.tags ?? null,
  };
}

function toUpdatePayload(i: Partial<InventoryItem>) {
  return {
    name: i.name,
    categoryId: i.categoryId,
    purchasePrice: i.purchasePrice,
    purchaseDate: i.purchaseDate,
    currency: i.currency,
    description: i.description ?? null,
    brand: i.brand ?? null,
    condition: i.condition ?? null,
    location: i.location ?? null,
    tags: i.tags ?? null,
  };
}

function sortToServer(sort: InventorySort): string {
  switch (sort) {
    case 'pinned-recent': return 'pinnedRecent';
    case 'price-desc': return 'priceDesc';
    case 'price-asc': return 'priceAsc';
    case 'name-asc': return 'nameAsc';
  }
}
