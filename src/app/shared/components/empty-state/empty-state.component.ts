import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty">
      <div class="icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="9"/>
          <path d="M8 12 h8"/>
        </svg>
      </div>
      <h3 class="title">{{ title() }}</h3>
      @if (description()) {
        <p class="desc">{{ description() }}</p>
      }
      <ng-content/>
    </div>
  `,
  styles: [`
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-12) var(--space-4);
      gap: var(--space-3);
      text-align: center;
      color: var(--color-text-secondary);
    }
    .icon {
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-full);
      background-color: var(--color-bg-elevated);
      color: var(--color-text-muted);
      margin-bottom: var(--space-2);
    }
    .title {
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }
    .desc {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      max-width: 360px;
    }
  `],
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly description = input<string>('');
}
