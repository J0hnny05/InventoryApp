import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { InventoryItem } from '../../models/inventory-item.model';
import { MoneyPipe } from '../../pipes/money.pipe';

export interface SellDialogData {
  readonly item: InventoryItem;
}

export interface SellDialogResult {
  readonly salePrice: number;
  readonly soldAt: string;
}

@Component({
  selector: 'invy-sell-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './sell-dialog.component.html',
  styleUrl: './sell-dialog.component.scss',
})
export class SellDialogComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly dialogRef = inject(
    MatDialogRef<SellDialogComponent, SellDialogResult | undefined>,
  );
  private readonly money = new MoneyPipe();
  readonly data = inject<SellDialogData>(MAT_DIALOG_DATA);

  readonly form = this.fb.group({
    salePrice: this.fb.control(this.data.item.purchasePrice, [Validators.min(0)]),
    soldAt: this.fb.control(new Date().toISOString().slice(0, 10)),
  });

  private readonly priceSignal = toSignal(this.form.controls.salePrice.valueChanges, {
    initialValue: this.form.controls.salePrice.value,
  });

  readonly profit = computed(() => (this.priceSignal() ?? 0) - this.data.item.purchasePrice);

  readonly profitText = computed(() => {
    const p = this.profit();
    const sign = p > 0 ? '+' : '';
    return `${sign}${this.money.transform(p, this.data.item.currency)}`;
  });

  readonly profitClass = computed(() => {
    const p = this.profit();
    if (p > 0) return 'invy-positive';
    if (p < 0) return 'invy-negative';
    return '';
  });

  confirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.dialogRef.close({ salePrice: Number(v.salePrice) || 0, soldAt: v.soldAt });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
