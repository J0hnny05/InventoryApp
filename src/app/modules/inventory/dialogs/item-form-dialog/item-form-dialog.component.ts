import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
import { MatSelectModule } from '@angular/material/select';
import { CategoriesStore } from '../../../../store/categories.store';
import { DEFAULT_CURRENCY, UiStore } from '../../../../store/ui.store';
import {
  InventoryItem,
  ItemCondition,
  NewInventoryItemInput,
} from '../../models/inventory-item.model';

export interface ItemFormDialogData {
  readonly item?: InventoryItem;
}

export type ItemFormDialogResult = NewInventoryItemInput;

const CURRENCY_OPTIONS: ReadonlyArray<string> = ['MDL', 'EUR', 'USD', 'RON', 'GBP'];

@Component({
  selector: 'invy-item-form-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './item-form-dialog.component.html',
  styleUrl: './item-form-dialog.component.scss',
})
export class ItemFormDialogComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly dialogRef = inject(
    MatDialogRef<ItemFormDialogComponent, ItemFormDialogResult | undefined>,
  );
  private readonly data = inject<ItemFormDialogData>(MAT_DIALOG_DATA, { optional: true }) ?? {};
  private readonly categoriesStore = inject(CategoriesStore);
  private readonly uiStore = inject(UiStore);

  readonly categories = this.categoriesStore.categories;
  readonly currencyOptions = CURRENCY_OPTIONS;
  readonly isEdit = !!this.data.item;

  readonly form = this.fb.group({
    name: this.fb.control('', [Validators.required, Validators.maxLength(120)]),
    categoryId: this.fb.control('', Validators.required),
    purchasePrice: this.fb.control(0, [Validators.min(0)]),
    purchaseDate: this.fb.control(new Date().toISOString().slice(0, 10)),
    currency: this.fb.control(this.uiStore.defaultCurrency() || DEFAULT_CURRENCY),
    condition: this.fb.control<ItemCondition>('new'),
    brand: this.fb.control(''),
    location: this.fb.control(''),
    description: this.fb.control(''),
    tagsCsv: this.fb.control(''),
  });

  constructor() {
    const it = this.data.item;
    if (it) {
      this.form.patchValue({
        name: it.name,
        categoryId: it.categoryId,
        purchasePrice: it.purchasePrice,
        purchaseDate: it.purchaseDate,
        currency: it.currency,
        condition: it.condition ?? 'new',
        brand: it.brand ?? '',
        location: it.location ?? '',
        description: it.description ?? '',
        tagsCsv: (it.tags ?? []).join(', '),
      });
    } else if (this.categories().length > 0) {
      this.form.patchValue({ categoryId: this.categories()[0].id });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const tags = v.tagsCsv
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const result: ItemFormDialogResult = {
      name: v.name.trim(),
      categoryId: v.categoryId,
      purchasePrice: Number(v.purchasePrice) || 0,
      purchaseDate: v.purchaseDate,
      currency: (v.currency || DEFAULT_CURRENCY).toUpperCase().slice(0, 3),
      condition: v.condition,
      brand: v.brand.trim() || undefined,
      location: v.location.trim() || undefined,
      description: v.description.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    };
    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
