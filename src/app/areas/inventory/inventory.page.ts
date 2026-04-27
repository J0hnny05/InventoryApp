import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { InventoryStore } from '../../store/inventory.store';
import { CategoriesStore } from '../../store/categories.store';
import { InventorySort, UiStore } from '../../store/ui.store';
import { InventoryItem } from '../../modules/inventory/models/inventory-item.model';
import { Category } from '../../modules/categories/models/category.model';

import { ItemCardComponent } from '../../modules/inventory/components/item-card/item-card.component';
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
import { openConfirm } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'invy-inventory-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PageHeaderComponent,
    EmptyStateComponent,
    ItemCardComponent,
  ],
  templateUrl: './inventory.page.html',
  styleUrl: './inventory.page.scss',
})
export class InventoryPage {
  private readonly inventoryStore = inject(InventoryStore);
  private readonly categoriesStore = inject(CategoriesStore);
  private readonly uiStore = inject(UiStore);
  private readonly dialog = inject(MatDialog);

  readonly categories = this.categoriesStore.categories;
  readonly totalOwned = computed(() => this.inventoryStore.owned().length);

  readonly search = computed(() => this.uiStore.inventoryFilter().search);
  readonly categoryFilter = computed(() => this.uiStore.inventoryFilter().categoryId);
  readonly sort = this.uiStore.inventorySort;

  readonly visibleItems = computed<readonly InventoryItem[]>(() => {
    const base = this.inventoryStore.ownedOrdered();
    const filter = this.uiStore.inventoryFilter();
    const search = filter.search.trim().toLowerCase();

    const filtered = base.filter((it) => {
      if (filter.categoryId && it.categoryId !== filter.categoryId) return false;
      if (search) {
        const haystack = [it.name, it.brand, it.location, ...(it.tags ?? [])]
          .filter((p): p is string => !!p)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });

    return this.applySort(filtered, this.sort());
  });

  categoryById(id: string): Category | undefined {
    return this.categoriesStore.byIdMap().get(id);
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.uiStore.setSearch(value);
  }

  onSortChange(value: InventorySort): void {
    this.uiStore.setSort(value);
  }

  onCategoryFilter(id: string | null): void {
    this.uiStore.setCategoryFilter(id);
  }

  clearFilters(): void {
    this.uiStore.resetFilters();
  }

  togglePin(id: string): void {
    this.inventoryStore.togglePin(id);
  }

  recordUse(id: string): void {
    this.inventoryStore.recordUse(id);
  }

  async openAddDialog(): Promise<void> {
    const ref = this.dialog.open<
      ItemFormDialogComponent,
      ItemFormDialogData,
      ItemFormDialogResult | undefined
    >(ItemFormDialogComponent, { data: {}, autoFocus: 'first-tabbable' });
    const result = await firstValueFrom(ref.afterClosed());
    if (result) this.inventoryStore.add(result);
  }

  async openEditDialog(id: string): Promise<void> {
    const item = this.inventoryStore.items().find((i) => i.id === id);
    if (!item) return;
    const ref = this.dialog.open<
      ItemFormDialogComponent,
      ItemFormDialogData,
      ItemFormDialogResult | undefined
    >(ItemFormDialogComponent, { data: { item }, autoFocus: 'first-tabbable' });
    const result = await firstValueFrom(ref.afterClosed());
    if (result) this.inventoryStore.update(id, result);
  }

  async openSellDialog(id: string): Promise<void> {
    const item = this.inventoryStore.items().find((i) => i.id === id);
    if (!item) return;
    const ref = this.dialog.open<SellDialogComponent, SellDialogData, SellDialogResult | undefined>(
      SellDialogComponent,
      { data: { item }, autoFocus: 'first-tabbable' },
    );
    const result = await firstValueFrom(ref.afterClosed());
    if (result) this.inventoryStore.sell(id, result.salePrice, result.soldAt);
  }

  async confirmDelete(id: string): Promise<void> {
    const item = this.inventoryStore.items().find((i) => i.id === id);
    if (!item) return;
    const ok = await openConfirm(this.dialog, {
      title: 'Delete this item?',
      message: `"${item.name}" will be permanently removed. This can't be undone.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (ok) this.inventoryStore.remove(id);
  }

  private applySort(list: readonly InventoryItem[], sort: InventorySort): InventoryItem[] {
    const arr = [...list];
    switch (sort) {
      case 'price-desc':
        return arr.sort((a, b) => b.purchasePrice - a.purchasePrice);
      case 'price-asc':
        return arr.sort((a, b) => a.purchasePrice - b.purchasePrice);
      case 'name-asc':
        return arr.sort((a, b) => a.name.localeCompare(b.name));
      case 'pinned-recent':
      default:
        return arr; // already pinned-then-createdAt-desc from store
    }
  }
}
