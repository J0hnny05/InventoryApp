import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';

import { HelpersApi, HelperResponse } from '../../api/users.api';
import { HelperPermissionsDto } from '../../auth/models/helper-permissions.model';
import { openConfirm } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { HelperFormDialog, HelperFormData, HelperFormResult } from './helper-form.dialog';

@Component({
  selector: 'invy-helpers-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './helpers.page.html',
  styleUrl: './helpers.page.scss',
})
export class HelpersPage {
  private readonly api = inject(HelpersApi);
  private readonly dialog = inject(MatDialog);

  readonly helpers = signal<readonly HelperResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly displayedColumns = ['username', 'permissions', 'lastLoginAt', 'createdAt', 'actions'];

  constructor() {
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const page = await firstValueFrom(this.api.list(0, 100));
      this.helpers.set(page.items);
    } catch {
      this.error.set('Could not load helpers.');
    } finally {
      this.loading.set(false);
    }
  }

  async openCreate(): Promise<void> {
    const ref = this.dialog.open<HelperFormDialog, HelperFormData, HelperFormResult | undefined>(
      HelperFormDialog, { data: { mode: 'create' }, autoFocus: 'first-tabbable' },
    );
    const result = await firstValueFrom(ref.afterClosed());
    if (!result || result.mode !== 'create' || !result.username || !result.password) return;
    try {
      await firstValueFrom(this.api.create({
        username: result.username,
        password: result.password,
        email: result.email ?? null,
        permissions: result.permissions,
      }));
      await this.load();
    } catch (err) {
      alert(humanise(err, 'Could not create the helper.'));
    }
  }

  async openEdit(helper: HelperResponse): Promise<void> {
    const ref = this.dialog.open<HelperFormDialog, HelperFormData, HelperFormResult | undefined>(
      HelperFormDialog, { data: { mode: 'edit-permissions', helper } },
    );
    const result = await firstValueFrom(ref.afterClosed());
    if (!result) return;
    try {
      await firstValueFrom(this.api.updatePermissions(helper.id, result.permissions));
      await this.load();
    } catch (err) {
      alert(humanise(err, 'Could not update permissions.'));
    }
  }

  async remove(helper: HelperResponse): Promise<void> {
    const ok = await openConfirm(this.dialog, {
      title: 'Delete this helper?',
      message: `"${helper.username}" will lose access immediately. This can't be undone.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await firstValueFrom(this.api.remove(helper.id));
      await this.load();
    } catch (err) {
      alert(humanise(err, 'Could not delete the helper.'));
    }
  }

  permList(p: HelperPermissionsDto): string {
    const items: string[] = [];
    if (p.canAdd) items.push('Add');
    if (p.canEdit) items.push('Edit');
    if (p.canDelete) items.push('Delete');
    if (p.canSell) items.push('Sell');
    if (p.canRecordUse) items.push('Use');
    return items.length === 0 ? 'Read-only' : items.join(' · ');
  }
}

function humanise(err: unknown, fallback: string): string {
  const e = err as { error?: { detail?: string; title?: string; errors?: Record<string, string[]> } };
  if (e?.error?.errors) {
    const first = Object.values(e.error.errors)[0]?.[0];
    if (first) return first;
  }
  return e?.error?.detail ?? e?.error?.title ?? fallback;
}
