import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface CurrencyAmount {
  currency: string;
  amount: number;
}

export interface RecentItemSummary {
  id: string;
  name: string;
  currency: string;
  purchasePrice: number;
  createdAt: string;
}

export interface RecentSaleSummary {
  id: string;
  name: string;
  currency: string;
  profit: number;
  soldAt: string;        // yyyy-MM-dd
}

export interface MyStatisticsResponse {
  username: string;
  role: string;
  ownedCount: number;
  soldCount: number;
  pinnedCount: number;
  totalUseCount: number;
  totalViewCount: number;
  ownedValueByCurrency: readonly CurrencyAmount[];
  realizedProfitByCurrency: readonly CurrencyAmount[];
  recentItems: readonly RecentItemSummary[];
  recentSales: readonly RecentSaleSummary[];
  lastLoginAt: string | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class MeApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/me`;

  statistics(): Observable<MyStatisticsResponse> {
    return this.http.get<MyStatisticsResponse>(`${this.base}/statistics`);
  }
}
