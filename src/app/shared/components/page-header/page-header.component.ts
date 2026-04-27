import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'invy-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <div class="page-header__text">
        @if (eyebrow()) {
          <span class="invy-eyebrow">{{ eyebrow() }}</span>
        }
        <h1 class="page-header__title">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="page-header__subtitle invy-muted">{{ subtitle() }}</p>
        }
      </div>
      <div class="page-header__actions">
        <ng-content />
      </div>
    </header>
  `,
  styles: [
    `
      :host { display: block; }

      .page-header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 16px;
        padding: 24px 28px;
        background: var(--invy-paper, #FAF8F4);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 22px;
      }

      .page-header__text {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .page-header__title {
        font-size: 1.75rem;
        font-weight: 600;
        letter-spacing: -0.02em;
      }

      .page-header__subtitle {
        font-size: 0.95rem;
      }

      .page-header__actions {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }

      @media (max-width: 640px) {
        .page-header { flex-direction: column; align-items: flex-start; padding: 18px; }
      }
    `,
  ],
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly eyebrow = input<string>('');
}
