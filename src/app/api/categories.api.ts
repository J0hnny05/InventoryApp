import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';
import { Category } from '../modules/categories/models/category.model';
import { PagedResult } from './paged-result.model';

interface ServerCategory {
  id: string;
  name: string;
  builtIn: boolean;
  color: string | null;
  icon: string | null;
}

@Injectable({ providedIn: 'root' })
export class CategoriesApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/categories`;

  list(skip = 0, take = 200): Observable<PagedResult<Category>> {
    const params = new HttpParams().set('skip', skip).set('take', take);
    return this.http
      .get<PagedResult<ServerCategory>>(this.base, { params })
      .pipe(map((r) => ({ ...r, items: r.items.map(toCategory) })));
  }

  create(input: { name: string; color?: string; icon?: string }): Observable<Category> {
    return this.http
      .post<ServerCategory>(this.base, {
        name: input.name,
        color: input.color ?? null,
        icon: input.icon ?? null,
      })
      .pipe(map(toCategory));
  }

  rename(id: string, name: string): Observable<Category> {
    return this.http.patch<ServerCategory>(`${this.base}/${id}`, { name }).pipe(map(toCategory));
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

function toCategory(s: ServerCategory): Category {
  return {
    id: s.id,
    name: s.name,
    builtIn: s.builtIn,
    color: s.color ?? undefined,
    icon: s.icon ?? undefined,
  };
}
