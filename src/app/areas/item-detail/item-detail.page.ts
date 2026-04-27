import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { InventoryStore } from '../../store/inventory.store';
import { CategoriesStore } from '../../store/categories.store';
import {
  InventoryItem,
  daysOwned,
  profitOf,
  roiOf,
} from '../../modules/inventory/models/inventory-item.model';
import { MoneyPipe } from '../../modules/inventory/pipes/money.pipe';
import { ProfitClassPipe } from '../../modules/inventory/pipes/profit-class.pipe';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { openConfirm } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  ItemFormDialogComponent,
  ItemFormDialogData,
  ItemFormDialogResult,
} from '../../modules/inventory/dialogs/item-form-dialog/item-form-dialog.component';
import {
  SellDialogComponent,
  SellDialogData,
  SellDialogResult,
} from '../../modules/inventory/dialogs/sell-dialog/sell-dialog.component';

@Component({
  selector: 'invy-item-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    EmptyStateComponent,
    MoneyPipe,
    ProfitClassPipe,
  ],
  templateUrl: './item-detail.page.html',
  styleUrl: './item-detail.page.scss',
})
export class ItemDetailPage {
  /** Provided by the router via withComponentInputBinding(). */
  readonly id = input.required<string>();

  private readonly inventoryStore = inject(InventoryStore);
  private readonly categoriesStore = inject(CategoriesStore);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly item = computed(() =>
    this.inventoryStore.items().find((i) => i.id === this.id()),
  );

  constructor() {
    // record a view exactly once when the route activates with a valid id
    let viewedId: string | null = null;
    effect(() => {
      const it = this.item();
      if (it && it.id !== viewedId) {
        viewedId = it.id;
        this.inventoryStore.recordView(it.id);
      }
    });
  }

  resolveCategory(id: string): string {
    return this.categoriesStore.resolveName(id);
  }

  profit(it: InventoryItem): number {
    return profitOf(it);
  }

  roi(it: InventoryItem): number {
    return roiOf(it);
  }

  daysOwnedOf(it: InventoryItem): number {
    return daysOwned(it);
  }

  formatRelative(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    if (ms < 60_000) return 'just now';
    const m = Math.floor(ms / 60_000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return iso.slice(0, 10);
  }

  recordUse(id: string): void {
    this.inventoryStore.recordUse(id);
  }

  togglePin(id: string): void {
    this.inventoryStore.togglePin(id);
  }

  async openEdit(it: InventoryItem): Promise<void> {
    const ref = this.dialog.open<
      ItemFormDialogComponent,
      ItemFormDialogData,
      ItemFormDialogResult | undefined
    >(ItemFormDialogComponent, { data: { item: it }, autoFocus: 'first-tabbable' });
    const result = await firstValueFrom(ref.afterClosed());
    if (result) this.inventoryStore.update(it.id, result);
  }

  async openSell(it: InventoryItem): Promise<void> {
    const ref = this.dialog.open<SellDialogComponent, SellDialogData, SellDialogResult | undefined>(
      SellDialogComponent,
      { data: { item: it }, autoFocus: 'first-tabbable' },
    );
    const result = await firstValueFrom(ref.afterClosed());
    if (result) this.inventoryStore.sell(it.id, result.salePrice, result.soldAt);
  }

  async confirmDelete(it: InventoryItem): Promise<void> {
    const ok = await openConfirm(this.dialog, {
      title: 'Delete this item?',
      message: `"${it.name}" will be permanently removed. This can't be undone.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (ok) {
      this.inventoryStore.remove(it.id);
      this.router.navigate(['/inventory']);
    }
  }
}
