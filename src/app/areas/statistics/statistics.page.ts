import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'invy-statistics-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Statistics</h1>`,
})
export class StatisticsPage {}
