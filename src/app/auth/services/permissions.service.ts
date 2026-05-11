import { Injectable, computed, inject } from '@angular/core';

import { AuthService } from './auth.service';
import { HelperPermissionsDto } from '../models/helper-permissions.model';

/**
 * Centralised UI permission flags. Mirrors the backend `PermissionGuard`:
 *  - Owner / Admin → everything allowed.
 *  - Helper → only what the per-helper toggles say.
 *  - Pin uses the Edit toggle (matches `TogglePinHandler.EnsureCanEditAsync`).
 *  - Categories management is owner+admin only (helpers never).
 *
 * The backend re-checks every action, so these flags are purely cosmetic —
 * hiding buttons we know would 403 keeps the UI honest.
 */
@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private readonly auth = inject(AuthService);

  private readonly role = this.auth.role;
  private readonly hp = this.auth.helperPermissions;

  readonly isOwnerOrAdmin = computed(() => {
    const r = this.role();
    return r === 'owner' || r === 'admin';
  });

  readonly isHelper = computed(() => this.role() === 'helper');
  readonly isAdmin  = computed(() => this.role() === 'admin');
  readonly isOwner  = computed(() => this.role() === 'owner');

  readonly canAdd       = computed(() => check(this.role(), this.hp(), 'canAdd'));
  readonly canEdit      = computed(() => check(this.role(), this.hp(), 'canEdit'));
  readonly canDelete    = computed(() => check(this.role(), this.hp(), 'canDelete'));
  readonly canSell      = computed(() => check(this.role(), this.hp(), 'canSell'));
  readonly canRecordUse = computed(() => check(this.role(), this.hp(), 'canRecordUse'));
  /** Backend treats pin as edit. */
  readonly canPin       = this.canEdit;

  /** Categories: owner + admin only. Helpers never. */
  readonly canManageCategories = this.isOwnerOrAdmin;
  /** Helpers list mgmt: owner + admin (admin sees but typically uses /admin/users). */
  readonly canManageHelpers = this.isOwnerOrAdmin;
}

type PermKey = 'canAdd' | 'canEdit' | 'canDelete' | 'canSell' | 'canRecordUse';

function check(role: string | null, hp: HelperPermissionsDto | null | undefined, key: PermKey): boolean {
  if (role === 'owner' || role === 'admin') return true;
  if (role === 'helper') return !!hp?.[key];
  // Not yet authenticated — be conservative.
  return false;
}
