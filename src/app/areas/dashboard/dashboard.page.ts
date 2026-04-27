import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'invy-dashboard-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Dashboard</h1>`,
})
export class DashboardPage {}
