import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InventoryStore } from '../../store/inventory.store';
import { CategoriesStore } from '../../store/categories.store';
import { UiStore } from '../../store/ui.store';
import { InventoryItem, profitOf, roiOf } from '../../modules/inventory/models/inventory-item.model';
import { MoneyPipe } from '../../modules/inventory/pipes/money.pipe';
import { ProfitClassPipe } from '../../modules/inventory/pipes/profit-class.pipe';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

interface CategoryRow {
  readonly id: string;
  readonly name: string;
  readonly count: number;
  readonly profit: number;
}

@Component({
  selector: 'invy-sold-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    PageHeaderComponent,
    StatCardComponent,
    EmptyStateComponent,
    MoneyPipe,
    ProfitClassPipe,
  ],
  templateUrl: './sold.page.html',
  styleUrl: './sold.page.scss',
})
export class SoldPage {
  private readonly inventoryStore = inject(InventoryStore);
  private readonly categoriesStore = inject(CategoriesStore);
  private readonly uiStore = inject(UiStore);

  readonly defaultCurrency = this.uiStore.defaultCurrency;

  readonly items = this.inventoryStore.soldOrdered;
  readonly soldCount = computed(() => this.inventoryStore.sold().length);
  readonly totalRevenue = this.inventoryStore.totalSoldRevenue;
  readonly totalProfit  = this.inventoryStore.totalRealizedProfit;
  readonly totalCost = computed(() =>
    this.inventoryStore.sold().reduce((sum, i) => sum + i.purchasePrice, 0),
  );

  readonly profitHint = computed(() => {
    const count = this.soldCount();
    if (count === 0) return 'Nothing sold yet';
    const avg = this.totalProfit() / count;
    const sign = avg >= 0 ? '+' : '';
    return `avg ${sign}${avg.toFixed(0)} per item`;
  });

  readonly byCategory = computed<readonly CategoryRow[]>(() => {
    const map = new Map<string, { count: number; profit: number }>();
    for (const it of this.inventoryStore.sold()) {
      const slot = map.get(it.categoryId) ?? { count: 0, profit: 0 };
      slot.count += 1;
      slot.profit += profitOf(it);
      map.set(it.categoryId, slot);
    }
    const rows: CategoryRow[] = [];
    for (const [id, slot] of map) {
      rows.push({
        id,
        name: this.categoriesStore.resolveName(id),
        count: slot.count,
        profit: slot.profit,
      });
    }
    return rows.sort((a, b) => Math.abs(b.profit) - Math.abs(a.profit));
  });

  resolveCategory(id: string): string {
    return this.categoriesStore.resolveName(id);
  }

  profit(item: InventoryItem): number {
    return profitOf(item);
  }

  roi(item: InventoryItem): number {
    return roiOf(item);
  }
}
