import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PercentFormatPipe } from '../../pipes/percent-format.pipe';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';

@Component({
  selector: 'app-price-change',
  standalone: true,
  imports: [PercentFormatPipe, CurrencyFormatPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="price-change" [class.is-up]="isUp()" [class.is-down]="isDown()" [class.is-flat]="isFlat()">
      <span class="arrow" aria-hidden="true">
        @if (isUp()) {
          <svg viewBox="0 0 12 12" width="10" height="10"><path d="M6 2 L10 8 L2 8 Z" fill="currentColor"/></svg>
        } @else if (isDown()) {
          <svg viewBox="0 0 12 12" width="10" height="10"><path d="M6 10 L2 4 L10 4 Z" fill="currentColor"/></svg>
        } @else {
          <svg viewBox="0 0 12 12" width="10" height="10"><rect x="2" y="5" width="8" height="2" fill="currentColor"/></svg>
        }
      </span>
      <span class="value">
        @if (mode() === 'percent') {
          {{ value() | percentFmt }}
        } @else if (mode() === 'currency') {
          {{ value() | currencyFmt:{ signed: true } }}
        } @else {
          {{ formatRaw() }}
        }
      </span>
    </span>
  `,
  styles: [`
    .price-change {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      font-variant-numeric: tabular-nums;
      font-weight: var(--font-weight-medium);
      font-size: inherit;
    }
    .price-change.is-up { color: var(--color-accent-green); }
    .price-change.is-down { color: var(--color-accent-red); }
    .price-change.is-flat { color: var(--color-text-muted); }
    .arrow { display: inline-flex; }
  `],
})
export class PriceChangeComponent {
  readonly value = input.required<number>();
  readonly mode = input<'percent' | 'currency' | 'raw'>('percent');

  protected readonly isUp = computed(() => this.value() > 0);
  protected readonly isDown = computed(() => this.value() < 0);
  protected readonly isFlat = computed(() => this.value() === 0);

  protected readonly formatRaw = computed(() => {
    const v = this.value();
    const sign = v > 0 ? '+' : '';
    return sign + v.toFixed(2);
  });
}
