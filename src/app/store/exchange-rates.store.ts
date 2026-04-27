import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { LocalStoragePersistenceService } from './persistence/local-storage.service';

interface OpenErApiResponse {
  readonly result: 'success' | 'error';
  readonly base_code: string;
  readonly rates: Record<string, number>;
  readonly time_last_update_unix: number;
}

interface CachedRates {
  readonly rates: Record<string, number>;
  readonly ts: string;       // ISO timestamp of remote update
}

const STORAGE_KEY = 'rates.eur';
/** Refresh threshold — the upstream API updates roughly once per day. */
const STALE_AFTER_MS = 12 * 60 * 60 * 1000;
const ENDPOINT = 'https://open.er-api.com/v6/latest/EUR';

@Injectable({ providedIn: 'root' })
export class ExchangeRatesStore {
  private readonly persistence = inject(LocalStoragePersistenceService);
  private readonly http = inject(HttpClient);

  private readonly _ratesPerEur = signal<ReadonlyMap<string, number> | null>(this.loadCache());
  private readonly _lastUpdated = signal<Date | null>(this.loadTimestamp());
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly ratesPerEur = this._ratesPerEur.asReadonly();
  readonly lastUpdated = this._lastUpdated.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isReady = computed(() => this._ratesPerEur() !== null);

  constructor() {
    if (this.shouldRefresh()) this.refresh();
  }

  /** Force a fetch (used by retry buttons / manual refresh). */
  refresh(): void {
    if (this._loading()) return;
    this._loading.set(true);
    this._error.set(null);

    this.http.get<OpenErApiResponse>(ENDPOINT).subscribe({
      next: (res) => {
        if (res.result !== 'success' || !res.rates) {
          this._error.set('Exchange rate service did not return success.');
          this._loading.set(false);
          return;
        }
        const map = new Map<string, number>(
          Object.entries(res.rates).map(([code, rate]) => [code.toUpperCase(), rate]),
        );
        const ts = new Date(res.time_last_update_unix * 1000);
        this._ratesPerEur.set(map);
        this._lastUpdated.set(ts);
        this.persistence.write<CachedRates>(STORAGE_KEY, {
          rates: res.rates,
          ts: ts.toISOString(),
        });
        this._loading.set(false);
      },
      error: () => {
        this._error.set(
          this._ratesPerEur()
            ? 'Couldn\'t refresh rates — using cached values.'
            : 'Couldn\'t fetch exchange rates. Check your connection.',
        );
        this._loading.set(false);
      },
    });
  }

  /** Convert an amount in `currency` to EUR. Returns null if the currency is unknown. */
  toEur(amount: number, currency: string): number | null {
    const code = currency.toUpperCase();
    if (code === 'EUR') return amount;
    const rate = this._ratesPerEur()?.get(code);
    if (!rate || rate <= 0) return null;
    return amount / rate;
  }

  private shouldRefresh(): boolean {
    const ts = this._lastUpdated();
    if (!ts) return true;
    return Date.now() - ts.getTime() > STALE_AFTER_MS;
  }

  private loadCache(): ReadonlyMap<string, number> | null {
    const data = this.persistence.read<CachedRates>(STORAGE_KEY);
    if (!data?.rates) return null;
    return new Map(
      Object.entries(data.rates).map(([code, rate]) => [code.toUpperCase(), rate]),
    );
  }

  private loadTimestamp(): Date | null {
    const data = this.persistence.read<CachedRates>(STORAGE_KEY);
    return data?.ts ? new Date(data.ts) : null;
  }
}
