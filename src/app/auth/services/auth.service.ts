import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, firstValueFrom, lastValueFrom, of, tap } from 'rxjs';

import { AuthApi, ChangePasswordPayload, LoginPayload, RegisterPayload } from './auth.api';
import { AuthResponse, AuthUser } from '../models/user.model';
import { UserRole } from '../models/role.model';
import { HelperPermissionsDto } from '../models/helper-permissions.model';

/** Persisted across reloads. Only the refresh token + a tiny snapshot of the user. */
const STORAGE_KEY = 'invy:auth';
/** Refresh the access token this many ms before it expires. */
const REFRESH_LEEWAY_MS = 30_000;

interface PersistedSession {
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApi);
  private readonly router = inject(Router);

  /** In-memory access token (never persisted). */
  private accessToken: string | null = null;
  private accessTokenExpiresAt: number = 0;
  private refreshToken: string | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  /** Single in-flight refresh promise so 401-storm doesn't fan out. */
  private inflightRefresh: Promise<string | null> | null = null;

  private readonly _user = signal<AuthUser | null>(null);
  private readonly _ready = signal<boolean>(false);

  readonly user = this._user.asReadonly();
  readonly ready = this._ready.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly role = computed<UserRole | null>(() => this._user()?.role ?? null);
  readonly helperPermissions = computed<HelperPermissionsDto | null>(
    () => this._user()?.helperPermissions ?? null,
  );
  readonly username = computed(() => this._user()?.username ?? '');

  /** Bootstrap on app startup: if we have a refresh token, swap it for an access token + profile. */
  async bootstrap(): Promise<void> {
    const persisted = this.readPersisted();
    if (persisted && Date.parse(persisted.refreshTokenExpiresAt) > Date.now()) {
      try {
        const res = await firstValueFrom(this.api.refresh(persisted.refreshToken));
        this.applyAuthResponse(res);
      } catch {
        this.clearAll();
      }
    }
    this._ready.set(true);
  }

  // ── public actions ──────────────────────────────────────────────────────

  async register(body: RegisterPayload): Promise<AuthResponse> {
    const res = await firstValueFrom(this.api.register(body));
    this.applyAuthResponse(res);
    return res;
  }

  async login(body: LoginPayload): Promise<AuthResponse> {
    const res = await firstValueFrom(this.api.login(body));
    this.applyAuthResponse(res);
    return res;
  }

  async logout(navigate: boolean = true): Promise<void> {
    if (this.accessToken) {
      try {
        await firstValueFrom(this.api.logout());
      } catch {
        // best-effort — the server might be unreachable
      }
    }
    this.clearAll();
    if (navigate) await this.router.navigateByUrl('/login');
  }

  changePassword(body: ChangePasswordPayload): Observable<void> {
    return this.api.changePassword(body).pipe(
      tap(() => {
        // Server invalidates refresh tokens — force re-login.
        this.clearAll();
        this.router.navigateByUrl('/login');
      }),
    );
  }

  /** Read latest /auth/me from the server (e.g. after a permissions change). */
  async refreshProfile(): Promise<AuthUser | null> {
    if (!this.accessToken) return null;
    try {
      const me = await firstValueFrom(this.api.me());
      this._user.set(me);
      return me;
    } catch {
      return null;
    }
  }

  // ── used by interceptor ─────────────────────────────────────────────────

  getAccessToken(): string | null {
    return this.accessToken;
  }

  /** Force a token refresh — used by the interceptor on a 401 retry. */
  refreshAccessToken(): Promise<string | null> {
    if (this.inflightRefresh) return this.inflightRefresh;
    if (!this.refreshToken) return Promise.resolve(null);
    const rt = this.refreshToken;
    this.inflightRefresh = lastValueFrom(this.api.refresh(rt))
      .then((res) => {
        this.applyAuthResponse(res);
        return res.accessToken;
      })
      .catch(() => {
        this.clearAll();
        return null;
      })
      .finally(() => {
        this.inflightRefresh = null;
      });
    return this.inflightRefresh;
  }

  // ── internals ───────────────────────────────────────────────────────────

  private applyAuthResponse(res: AuthResponse): void {
    this.accessToken = res.accessToken;
    this.accessTokenExpiresAt = Date.parse(res.accessTokenExpiresAt);
    this.refreshToken = res.refreshToken;
    this._user.set(res.user);
    this.writePersisted({
      refreshToken: res.refreshToken,
      refreshTokenExpiresAt: res.refreshTokenExpiresAt,
    });
    this.scheduleSilentRefresh();
  }

  private scheduleSilentRefresh(): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    if (!this.accessTokenExpiresAt) return;
    const delay = Math.max(5_000, this.accessTokenExpiresAt - Date.now() - REFRESH_LEEWAY_MS);
    this.refreshTimer = setTimeout(() => {
      this.refreshAccessToken();
    }, delay);
  }

  private clearAll(): void {
    this.accessToken = null;
    this.accessTokenExpiresAt = 0;
    this.refreshToken = null;
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this._user.set(null);
    this.clearPersisted();
  }

  private readPersisted(): PersistedSession | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as PersistedSession;
    } catch {
      return null;
    }
  }

  private writePersisted(s: PersistedSession): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      /* swallow */
    }
  }

  private clearPersisted(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  }
}

/** APP_INITIALIZER factory — wait for bootstrap to settle before booting routes. */
export function authBootstrapFactory(): () => Promise<void> {
  return () => {
    const auth = inject(AuthService);
    return auth.bootstrap();
  };
}
