import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ExchangeRatesApi } from '../api/exchange-rates.api';

/**
 * Live exchange-rate cache backed by `/api/exchange-rates` (the server is itself
 * a thin proxy over open.er-api.com with a daily-stale cache). Components only
 * need `toEur(amount, currency)` for cross-currency aggregates.
 */
@Injectable({ providedIn: 'root' })
export class ExchangeRatesStore {
  private readonly api = inject(ExchangeRatesApi);

  private readonly _ratesPerEur = signal<ReadonlyMap<string, number> | null>(null);
  private readonly _lastUpdated = signal<Date | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly ratesPerEur = this._ratesPerEur.asReadonly();
  readonly lastUpdated = this._lastUpdated.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isReady = computed(() => this._ratesPerEur() !== null);

  private hydrated = false;

  /** Lazy fetch once per session. Components can call this from a constructor. */
  async ensureLoaded(): Promise<void> {
    if (this.hydrated || this._loading()) return;
    await this.refresh(false);
  }

  /** Force a fetch (used by retry buttons / manual refresh). */
  async refresh(force: boolean = true): Promise<void> {
    if (this._loading()) return;
    this._loading.set(true);
    this._error.set(null);
    try {
      const snap = force
        ? await firstValueFrom(this.api.refresh('EUR'))
        : await firstValueFrom(this.api.get('EUR'));
      this._ratesPerEur.set(snap.rates);
      this._lastUpdated.set(snap.lastUpdated);
      this.hydrated = true;
    } catch {
      this._error.set(
        this._ratesPerEur()
          ? "Couldn't refresh rates — using cached values."
          : "Couldn't fetch exchange rates.",
      );
    } finally {
      this._loading.set(false);
    }
  }

  reset(): void {
    this._ratesPerEur.set(null);
    this._lastUpdated.set(null);
    this._error.set(null);
    this.hydrated = false;
  }

  /** Convert an amount in `currency` to EUR. Returns null if the currency is unknown. */
  toEur(amount: number, currency: string): number | null {
    const code = currency.toUpperCase();
    if (code === 'EUR') return amount;
    const rate = this._ratesPerEur()?.get(code);
    if (!rate || rate <= 0) return null;
    return amount / rate;
  }
}
