import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'invy-item-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './item-detail.page.html',
  styleUrl: './item-detail.page.scss',
})
export class ItemDetailPage {}
