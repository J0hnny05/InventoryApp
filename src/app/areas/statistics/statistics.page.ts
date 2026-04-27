import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'invy-statistics-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './statistics.page.html',
  styleUrl: './statistics.page.scss',
})
export class StatisticsPage {}
