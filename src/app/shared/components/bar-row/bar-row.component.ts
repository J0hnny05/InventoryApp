import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'invy-bar-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bar-row.component.html',
  styleUrl: './bar-row.component.scss',
})
export class BarRowComponent {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  readonly max   = input.required<number>();
  readonly display = input<string>('');
  readonly sub    = input<string>('');
  readonly color  = input<string>('');

  readonly percent = computed(() => {
    const m = this.max();
    if (!m || m <= 0) return 0;
    return Math.min(100, Math.max(0, (this.value() / m) * 100));
  });
}
