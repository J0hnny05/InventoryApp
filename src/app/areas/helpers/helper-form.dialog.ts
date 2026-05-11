import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { HelperPermissionsDto } from '../../auth/models/helper-permissions.model';
import { HelperResponse } from '../../api/users.api';

export interface HelperFormData {
  mode: 'create' | 'edit-permissions';
  helper?: HelperResponse;
}

export interface HelperFormResult {
  mode: 'create' | 'edit-permissions';
  username?: string;
  password?: string;
  email?: string | null;
  permissions: HelperPermissionsDto;
}

@Component({
  selector: 'invy-helper-form-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.mode === 'create' ? 'New helper' : 'Edit ' + data.helper?.username + ' permissions' }}
    </h2>
    <form mat-dialog-content [formGroup]="form" (ngSubmit)="save()" class="helper-form">
      @if (data.mode === 'create') {
        <mat-form-field appearance="outline">
          <mat-label>Username</mat-label>
          <input matInput formControlName="username" autocomplete="off" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Email (optional)</mat-label>
          <input matInput type="email" formControlName="email" autocomplete="off" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Password</mat-label>
          <input matInput type="password" formControlName="password" autocomplete="new-password" />
          <mat-hint align="end">share this with the helper</mat-hint>
        </mat-form-field>
      }

      <fieldset class="helper-form__perms" formGroupName="permissions">
        <legend>Permissions</legend>
        <mat-checkbox formControlName="canAdd">Add items</mat-checkbox>
        <mat-checkbox formControlName="canEdit">Edit items</mat-checkbox>
        <mat-checkbox formControlName="canDelete">Delete items</mat-checkbox>
        <mat-checkbox formControlName="canSell">Mark sold</mat-checkbox>
        <mat-checkbox formControlName="canRecordUse">Record use</mat-checkbox>
        <p class="helper-form__hint">Read access is always granted.</p>
      </fieldset>
    </form>
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid">
        {{ data.mode === 'create' ? 'Create helper' : 'Save' }}
      </button>
    </div>
  `,
  styles: `
    .helper-form { display: grid; gap: 8px; min-width: 360px; }
    .helper-form__perms {
      display: grid; gap: 4px;
      border: 1px solid rgba(0,0,0,0.12);
      border-radius: 8px;
      padding: 10px 14px;
      margin: 0;
      legend { padding: 0 6px; font-size: 12px; opacity: 0.7; }
    }
    .helper-form__hint { margin: 4px 0 0; font-size: 12px; opacity: 0.6; }
  `,
})
export class HelperFormDialog {
  readonly data: HelperFormData = inject(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<HelperFormDialog, HelperFormResult | undefined>);

  readonly form = new FormGroup({
    username: new FormControl<string>('', {
      nonNullable: true,
      validators: this.data.mode === 'create' ? [Validators.required, Validators.minLength(3), Validators.maxLength(64)] : [],
    }),
    email: new FormControl<string>('', { nonNullable: true }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: this.data.mode === 'create' ? [Validators.required, Validators.minLength(6)] : [],
    }),
    permissions: new FormGroup({
      canAdd: new FormControl(this.data.helper?.permissions.canAdd ?? false, { nonNullable: true }),
      canEdit: new FormControl(this.data.helper?.permissions.canEdit ?? false, { nonNullable: true }),
      canDelete: new FormControl(this.data.helper?.permissions.canDelete ?? false, { nonNullable: true }),
      canSell: new FormControl(this.data.helper?.permissions.canSell ?? false, { nonNullable: true }),
      canRecordUse: new FormControl(this.data.helper?.permissions.canRecordUse ?? false, { nonNullable: true }),
    }),
  });

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.ref.close({
      mode: this.data.mode,
      username: v.username,
      password: v.password,
      email: v.email?.trim() ? v.email.trim() : null,
      permissions: v.permissions,
    });
  }
}
