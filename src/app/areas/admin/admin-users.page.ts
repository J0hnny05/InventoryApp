import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';

import { AdminUserListItem, AdminUsersApi } from '../../api/users.api';
import { roleLabel } from '../../auth/models/role.model';
import { openConfirm } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'invy-admin-users-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './admin-users.page.html',
  styleUrl: './admin-users.page.scss',
})
export class AdminUsersPage {
  private readonly api = inject(AdminUsersApi);
  private readonly dialog = inject(MatDialog);

  readonly users = signal<readonly AdminUserListItem[]>([]);
  readonly total = signal(0);
  readonly skip = signal(0);
  readonly take = signal(25);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly displayedColumns = ['username', 'role', 'status', 'createdAt', 'lastLoginAt', 'actions'];

  readonly roleLabel = roleLabel;

  constructor() {
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const page = await firstValueFrom(this.api.list(this.skip(), this.take()));
      this.users.set(page.items);
      this.total.set(page.total);
    } catch {
      this.error.set('Could not load users.');
    } finally {
      this.loading.set(false);
    }
  }

  onPage(event: PageEvent): void {
    this.skip.set(event.pageIndex * event.pageSize);
    this.take.set(event.pageSize);
    this.load();
  }

  async block(u: AdminUserListItem): Promise<void> {
    if (u.role === 'admin') return;
    try {
      await firstValueFrom(this.api.block(u.id));
      await this.load();
    } catch (err) {
      alert(humanise(err, 'Could not block this user.'));
    }
  }

  async unblock(u: AdminUserListItem): Promise<void> {
    try {
      await firstValueFrom(this.api.unblock(u.id));
      await this.load();
    } catch (err) {
      alert(humanise(err, 'Could not unblock this user.'));
    }
  }

  async remove(u: AdminUserListItem): Promise<void> {
    const ok = await openConfirm(this.dialog, {
      title: `Delete ${u.username}?`,
      message:
        u.role === 'owner'
          ? 'Their inventory and helpers will also be deleted. This is permanent.'
          : 'This account will be removed permanently.',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await firstValueFrom(this.api.remove(u.id));
      await this.load();
    } catch (err) {
      alert(humanise(err, 'Could not delete this user.'));
    }
  }
}

function humanise(err: unknown, fallback: string): string {
  const e = err as { error?: { detail?: string; title?: string } };
  return e?.error?.detail ?? e?.error?.title ?? fallback;
}
