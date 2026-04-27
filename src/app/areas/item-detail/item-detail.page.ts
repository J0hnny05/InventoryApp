import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'invy-item-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Item detail</h1>`,
})
export class ItemDetailPage {}
