import { Injectable } from '@angular/core';

interface Envelope<T> {
  readonly v: number;
  readonly data: T;
}

@Injectable({ providedIn: 'root' })
export class LocalStoragePersistenceService {
  private readonly prefix = 'invy:';
  private readonly version = 1;

  read<T>(key: string): T | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(this.prefix + key);
      if (!raw) return null;
      const env = JSON.parse(raw) as Envelope<T>;
      if (env?.v !== this.version) return null;
      return env.data;
    } catch (err) {
      console.warn(`[invy] failed to read "${key}":`, err);
      return null;
    }
  }

  write<T>(key: string, value: T): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const env: Envelope<T> = { v: this.version, data: value };
      localStorage.setItem(this.prefix + key, JSON.stringify(env));
    } catch (err) {
      console.warn(`[invy] failed to write "${key}":`, err);
    }
  }

  remove(key: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(this.prefix + key);
  }

  /** Dump every key under our prefix — used for the backup/export flow. */
  exportAll(): Record<string, unknown> {
    if (typeof localStorage === 'undefined') return {};
    const out: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const fullKey = localStorage.key(i);
      if (!fullKey || !fullKey.startsWith(this.prefix)) continue;
      try {
        const raw = localStorage.getItem(fullKey);
        out[fullKey.slice(this.prefix.length)] = raw ? JSON.parse(raw) : null;
      } catch {
        // skip corrupt entries — exporting partial is better than failing entirely
      }
    }
    return out;
  }

  /** Restore from an exportAll() blob. Existing keys are overwritten. */
  importAll(blob: Record<string, unknown>): void {
    if (typeof localStorage === 'undefined') return;
    for (const [key, value] of Object.entries(blob)) {
      try {
        localStorage.setItem(this.prefix + key, JSON.stringify(value));
      } catch (err) {
        console.warn(`[invy] failed to import "${key}":`, err);
      }
    }
  }
}
