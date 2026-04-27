import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
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
    MoneyPipe,
    DaysOwnedPipe,
  ],
  templateUrl: './item-card.component.html',
  styleUrl: './item-card.component.scss',
})
export class ItemCardComponent {
  readonly item = input.required<InventoryItem>();
  readonly category = input<Category | undefined>(undefined);

  readonly pin    = output<string>();
  readonly use    = output<string>();
  readonly sell   = output<string>();
  readonly edit   = output<string>();
  readonly remove = output<string>();
}
