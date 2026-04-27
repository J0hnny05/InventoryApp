import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'invy-sold-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Sold</h1>`,
})
export class SoldPage {}
