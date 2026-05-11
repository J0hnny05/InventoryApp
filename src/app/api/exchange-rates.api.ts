import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';

interface ServerRates {
  baseCurrency: string;
  rates: Record<string, number>;
  lastUpdatedUtc: string;
}

export interface ExchangeRatesSnapshot {
  baseCurrency: string;
  rates: ReadonlyMap<string, number>;
  lastUpdated: Date;
}

@Injectable({ providedIn: 'root' })
export class ExchangeRatesApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/exchange-rates`;

  get(baseCurrency = 'EUR'): Observable<ExchangeRatesSnapshot> {
    const params = new HttpParams().set('baseCurrency', baseCurrency);
    return this.http.get<ServerRates>(this.base, { params }).pipe(map(toSnapshot));
  }

  refresh(baseCurrency = 'EUR'): Observable<ExchangeRatesSnapshot> {
    const params = new HttpParams().set('baseCurrency', baseCurrency);
    return this.http.post<ServerRates>(`${this.base}/refresh`, null, { params }).pipe(map(toSnapshot));
  }
}

function toSnapshot(s: ServerRates): ExchangeRatesSnapshot {
  return {
    baseCurrency: s.baseCurrency,
    rates: new Map(Object.entries(s.rates).map(([k, v]) => [k.toUpperCase(), v])),
    lastUpdated: new Date(s.lastUpdatedUtc),
  };
}
