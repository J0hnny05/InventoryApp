import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';

import { InventoryStore } from '../../store/inventory.store';
import { CategoriesStore } from '../../store/categories.store';
import { InventorySort, UiStore } from '../../store/ui.store';
import { InventoryApi } from '../../api/inventory.api';
import { PermissionsService } from '../../auth/services/permissions.service';
import { InventoryItem } from '../../modules/inventory/models/inventory-item.model';
import { Category } from '../../modules/categories/models/category.model';

import { MatCardModule } from '@angular/material/card';
import { ItemCardComponent } from '../../modules/inventory/components/item-card/item-card.component';
import { MoneyPipe } from '../../modules/inventory/pipes/money.pipe';
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

@Component({
  selector: 'invy-inventory-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    EmptyStateComponent,
    ItemCardComponent,
    MoneyPipe,
  ],
  templateUrl: './inventory.page.html',
  styleUrl: './inventory.page.scss',
})
export class InventoryPage {
  private readonly inventoryStore = inject(InventoryStore);
  private readonly categoriesStore = inject(CategoriesStore);
  private readonly uiStore = inject(UiStore);
  private readonly api = inject(InventoryApi);
  readonly perms = inject(PermissionsService);
  private readonly dialog = inject(MatDialog);

  readonly categories = this.categoriesStore.categories;

  /** Server-paged window of items for this page. */
  private readonly _pageItems = signal<readonly InventoryItem[]>([]);
  private readonly _total = signal(0);
  readonly visibleItems = this._pageItems.asReadonly();
  readonly total = this._total.asReadonly();
  readonly loading = signal(false);

  readonly skip = signal(0);
  readonly pageSize = signal(25);

  readonly totalOwned = this._total;
  readonly pinnedCount = computed(() => this._pageItems().filter((i) => i.pinned).length);

  readonly valueRows = computed<readonly { currency: string; amount: number }[]>(() => {
    const map = this.inventoryStore.ownedValueByCurrency();
    return Array.from(map, ([currency, amount]) => ({ currency, amount }))
      .sort((a, b) => b.amount - a.amount);
  });

  readonly search = computed(() => this.uiStore.inventoryFilter().search);
  readonly categoryFilter = computed(() => this.uiStore.inventoryFilter().categoryId);
  readonly sort = this.uiStore.inventorySort;

  readonly canAdd       = this.perms.canAdd;
  readonly canEdit      = this.perms.canEdit;
  readonly canSell      = this.perms.canSell;
  readonly canDelete    = this.perms.canDelete;
  readonly canRecordUse = this.perms.canRecordUse;
  readonly canPin       = this.perms.canPin;

  constructor() {
    this.categoriesStore.ensureLoaded();
    // Re-fetch when filters/sort/page change.
    effect(() => {
      const _ = [this.search(), this.categoryFilter(), this.sort(), this.skip(), this.pageSize()];
      void _;
      void this.reload();
    });
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    try {
      const page = await firstValueFrom(this.api.list({
        search: this.search() || undefined,
        categoryId: this.categoryFilter() ?? undefined,
        status: 'owned',
        sort: this.sort(),
        skip: this.skip(),
        take: this.pageSize(),
      }));
      this._pageItems.set(page.items);
      this._total.set(page.total);
      // Mirror into the store cache so totals/aggregates elsewhere stay in sync.
      void this.inventoryStore.ensureLoaded();
    } catch {
      this._pageItems.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  categoryById(id: string): Category | undefined {
    return this.categoriesStore.byIdMap().get(id);
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.skip.set(0);
    this.uiStore.setSearch(value);
  }

  onSortChange(value: InventorySort): void {
    this.skip.set(0);
    this.uiStore.setSort(value);
  }

  onCategoryFilter(id: string | null): void {
    this.skip.set(0);
    this.uiStore.setCategoryFilter(id);
  }

  onPage(event: PageEvent): void {
    this.skip.set(event.pageIndex * event.pageSize);
    this.pageSize.set(event.pageSize);
  }

  clearFilters(): void {
    this.skip.set(0);
    this.uiStore.resetFilters();
  }

  async togglePin(id: string): Promise<void> {
    await this.inventoryStore.togglePin(id);
    await this.reload();
  }

  async recordUse(id: string): Promise<void> {
    if (!this.canRecordUse()) return;
    await this.inventoryStore.recordUse(id);
    await this.reload();
  }

  async openAddDialog(): Promise<void> {
    if (!this.canAdd()) return;
    const ref = this.dialog.open<
      ItemFormDialogComponent,
      ItemFormDialogData,
      ItemFormDialogResult | undefined
    >(ItemFormDialogComponent, { data: {}, autoFocus: 'first-tabbable' });
    const result = await firstValueFrom(ref.afterClosed());
    if (result) {
      await this.inventoryStore.add(result);
      await this.reload();
    }
  }

  async openEditDialog(id: string): Promise<void> {
    if (!this.canEdit()) return;
    const item = this._pageItems().find((i) => i.id === id) ?? this.inventoryStore.items().find((i) => i.id === id);
    if (!item) return;
    const ref = this.dialog.open<
      ItemFormDialogComponent,
      ItemFormDialogData,
      ItemFormDialogResult | undefined
    >(ItemFormDialogComponent, { data: { item }, autoFocus: 'first-tabbable' });
    const result = await firstValueFrom(ref.afterClosed());
    if (result) {
      await this.inventoryStore.update(id, result);
      await this.reload();
    }
  }

  async openSellDialog(id: string): Promise<void> {
    if (!this.canSell()) return;
    const item = this._pageItems().find((i) => i.id === id) ?? this.inventoryStore.items().find((i) => i.id === id);
    if (!item) return;
    const ref = this.dialog.open<SellDialogComponent, SellDialogData, SellDialogResult | undefined>(
      SellDialogComponent,
      { data: { item }, autoFocus: 'first-tabbable' },
    );
    const result = await firstValueFrom(ref.afterClosed());
    if (result) {
      await this.inventoryStore.sell(id, result.salePrice, result.soldAt);
      await this.reload();
    }
  }

  async confirmDelete(id: string): Promise<void> {
    if (!this.canDelete()) return;
    const item = this._pageItems().find((i) => i.id === id);
    if (!item) return;
    const ok = await openConfirm(this.dialog, {
      title: 'Delete this item?',
      message: `"${item.name}" will be permanently removed. This can't be undone.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (ok) {
      await this.inventoryStore.remove(id);
      await this.reload();
    }
  }
}

