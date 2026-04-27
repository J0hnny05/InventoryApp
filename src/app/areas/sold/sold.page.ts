import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'invy-sold-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sold.page.html',
  styleUrl: './sold.page.scss',
})
export class SoldPage {}
