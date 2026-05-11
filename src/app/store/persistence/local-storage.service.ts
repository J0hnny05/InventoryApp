import { Injectable } from '@angular/core';

/**
 * One-shot cleanup of legacy `invy:*` localStorage keys from the pre-backend era.
 * Auth state lives under `invy:auth` and must survive — everything else is now
 * server-owned and can be safely purged.
 */
@Injectable({ providedIn: 'root' })
export class LegacyStorageCleanup {
  private readonly prefix = 'invy:';
  private readonly keepKeys = new Set([`${this.prefix}auth`, `${this.prefix}legacy-cleared`]);

  /** Run once per browser. Idempotent. */
  runOnce(): void {
    if (typeof localStorage === 'undefined') return;
    if (localStorage.getItem(`${this.prefix}legacy-cleared`) === '1') return;
    const victims: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(this.prefix)) continue;
      if (this.keepKeys.has(key)) continue;
      victims.push(key);
    }
    for (const k of victims) localStorage.removeItem(k);
    try {
      localStorage.setItem(`${this.prefix}legacy-cleared`, '1');
    } catch {
      /* swallow */
    }
  }
}
