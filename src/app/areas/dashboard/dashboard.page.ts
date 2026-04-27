import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'invy-dashboard-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage {}
