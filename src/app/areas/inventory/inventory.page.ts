import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'invy-inventory-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Inventory</h1>`,
})
export class InventoryPage {}
