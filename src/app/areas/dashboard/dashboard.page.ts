import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { InventoryStore } from '../../store/inventory.store';
import { CategoriesStore } from '../../store/categories.store';
import { UiStore } from '../../store/ui.store';
import { InventoryItem, profitOf } from '../../modules/inventory/models/inventory-item.model';
import { MoneyPipe } from '../../modules/inventory/pipes/money.pipe';
import { ProfitClassPipe } from '../../modules/inventory/pipes/profit-class.pipe';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import {
  ItemFormDialogComponent,
  ItemFormDialogResult,
} from '../../modules/inventory/dialogs/item-form-dialog/item-form-dialog.component';

const RECENT_LIMIT = 5;

@Component({
  selector: 'invy-dashboard-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
    StatCardComponent,
    MoneyPipe,
    ProfitClassPipe,
  ],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage {
  private readonly inventoryStore = inject(InventoryStore);
  private readonly categoriesStore = inject(CategoriesStore);
  private readonly uiStore = inject(UiStore);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly defaultCurrency = this.uiStore.defaultCurrency;
  readonly ownedCount = computed(() => this.inventoryStore.owned().length);
  readonly soldCount  = computed(() => this.inventoryStore.sold().length);
  readonly ownedValue = this.inventoryStore.totalOwnedValue;
  readonly totalProfit = this.inventoryStore.totalRealizedProfit;

  readonly pinnedHint = computed(() => {
    const n = this.inventoryStore.pinned().length;
    return n === 0 ? '0 pinned' : `${n} pinned`;
  });

  readonly profitHint = computed(() => {
    const n = this.soldCount();
    if (n === 0) return 'Nothing sold yet';
    const avg = this.totalProfit() / n;
    const sign = avg >= 0 ? '+' : '';
    return `avg ${sign}${avg.toFixed(0)} per item`;
  });

  readonly recentlyAdded = computed<readonly InventoryItem[]>(() =>
    [...this.inventoryStore.owned()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, RECENT_LIMIT),
  );

  readonly recentlySold = computed<readonly InventoryItem[]>(() =>
    [...this.inventoryStore.sold()]
      .sort((a, b) => (b.soldAt ?? '').localeCompare(a.soldAt ?? ''))
      .slice(0, RECENT_LIMIT),
  );

  resolveCategory(id: string): string {
    return this.categoriesStore.resolveName(id);
  }

  profit(it: InventoryItem): number {
    return profitOf(it);
  }

  async goAdd(): Promise<void> {
    const ref = this.dialog.open<ItemFormDialogComponent, unknown, ItemFormDialogResult | undefined>(
      ItemFormDialogComponent,
      { data: {}, autoFocus: 'first-tabbable' },
    );
    const result = await firstValueFrom(ref.afterClosed());
    if (result) {
      const created = this.inventoryStore.add(result);
      this.router.navigate(['/inventory', created.id]);
    }
  }
}
