import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'invy-inventory-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inventory.page.html',
  styleUrl: './inventory.page.scss',
})
export class InventoryPage {}
