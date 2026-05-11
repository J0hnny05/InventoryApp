import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InventoryItem } from '../../models/inventory-item.model';
import { Category } from '../../../categories/models/category.model';
import { MoneyPipe } from '../../pipes/money.pipe';
import { DaysOwnedPipe } from '../../pipes/days-owned.pipe';

@Component({
  selector: 'invy-item-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MoneyPipe,
    DaysOwnedPipe,
  ],
  templateUrl: './item-card.component.html',
  styleUrl: './item-card.component.scss',
})
export class ItemCardComponent {
  readonly item = input.required<InventoryItem>();
  readonly category = input<Category | undefined>(undefined);

  /** Permission gates — default `true` so owner/admin views are unchanged. */
  readonly canEdit   = input<boolean>(true);
  readonly canDelete = input<boolean>(true);
  readonly canSell   = input<boolean>(true);
  readonly canUse    = input<boolean>(true);
  readonly canPin    = input<boolean>(true);

  /** Hide the kebab when both menu actions are disallowed. */
  readonly showMenu = computed(() => this.canEdit() || this.canDelete());

  readonly pin    = output<string>();
  readonly use    = output<string>();
  readonly sell   = output<string>();
  readonly edit   = output<string>();
  readonly remove = output<string>();
}
