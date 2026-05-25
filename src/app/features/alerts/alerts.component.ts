import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AlertsService, AlertCondition } from '../../core/services/alerts.service';
import { MarketDataService } from '../../core/services/market-data.service';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CurrencyFormatPipe, IconComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <span class="eyebrow">Price Alerts</span>
          <h1 class="page-title">Alerts</h1>
          <p class="page-sub">{{ activeCount() }} active · {{ alerts.alerts().length }} total</p>
        </div>
      </header>

      <!-- Create form -->
      <article class="card create-card">
        <header class="card-header">
          <span class="card-title">New alert</span>
        </header>
        <div class="create-form">
          <div class="form-field">
            <label class="form-label" for="alert-symbol">Symbol</label>
            <input
              id="alert-symbol"
              type="text"
              class="form-input"
              placeholder="e.g. AAPL"
              [value]="newSymbol()"
              (input)="newSymbol.set($any($event.target).value.toUpperCase())"
              spellcheck="false"
            />
          </div>
          <div class="form-field">
            <label class="form-label" for="alert-cond">Condition</label>
            <select id="alert-cond" class="form-input form-select" (change)="newCondition.set($any($event.target).value)">
              <option value="above">Price goes above</option>
              <option value="below">Price goes below</option>
            </select>
          </div>
          <div class="form-field">
            <label class="form-label" for="alert-price">Target price ($)</label>
            <input
              id="alert-price"
              type="number"
              class="form-input"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              [value]="newPrice()"
              (input)="newPrice.set(+$any($event.target).value)"
            />
          </div>
          <div class="form-field form-action">
            <button
              class="btn btn-primary"
              [disabled]="!canCreate()"
              (click)="createAlert()"
            >
              <app-icon name="plus" [size]="14"/>
              Create alert
            </button>
          </div>
        </div>
        @if (formError()) {
          <p class="form-error">{{ formError() }}</p>
        }
      </article>

      <!-- Alerts list -->
      <section>
        @if (alerts.alerts().length === 0) {
          <app-empty-state
            title="No alerts yet"
            description="Create an alert above to get notified when an asset hits your target price."
          />
        } @else {
          <div class="alerts-list">
            @for (a of alerts.alerts(); track a.id) {
              <div class="alert-row" [class.is-inactive]="!a.active">
                <div class="alert-info">
                  <span class="symbol-tag">{{ a.symbol }}</span>
                  <span class="alert-cond">
                    {{ a.condition === 'above' ? 'rises above' : 'drops below' }}
                  </span>
                  <span class="alert-price">{{ a.targetPrice | currencyFmt }}</span>
                  @if (currentPrice(a.symbol); as cp) {
                    <span class="alert-current text-secondary">
                      · now {{ cp | currencyFmt }}
                    </span>
                  }
                </div>
                <div class="alert-meta">
                  @if (a.triggeredAt) {
                    <span class="badge badge-yellow">Triggered</span>
                  } @else if (a.active) {
                    <span class="badge badge-green">Active</span>
                  } @else {
                    <span class="badge badge-neutral">Paused</span>
                  }
                  <span class="alert-date">{{ formatDate(a.createdAt) }}</span>
                </div>
                <div class="alert-actions">
                  <button
                    class="btn btn-secondary btn-sm"
                    (click)="alerts.toggle(a.id)"
                    [title]="a.active ? 'Pause' : 'Resume'"
                  >{{ a.active ? 'Pause' : 'Resume' }}</button>
                  <button class="btn-icon" title="Delete" (click)="alerts.delete(a.id)">
                    <app-icon name="close" [size]="14"/>
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </section>
    </div>
  `,
  styleUrl: './alerts.component.css',
})
export class AlertsComponent {
  protected readonly alerts = inject(AlertsService);
  private readonly market = inject(MarketDataService);

  protected readonly newSymbol = signal('');
  protected readonly newCondition = signal<AlertCondition>('above');
  protected readonly newPrice = signal(0);
  protected readonly formError = signal('');

  protected readonly activeCount = computed(() => this.alerts.alerts().filter(a => a.active).length);
  protected readonly canCreate = computed(() => !!this.newSymbol().trim() && this.newPrice() > 0);

  protected currentPrice(symbol: string): number | undefined {
    return this.market.getBySymbol(symbol)?.price;
  }

  protected createAlert(): void {
    const sym = this.newSymbol().trim().toUpperCase();
    if (!sym) return;
    if (!this.market.getBySymbol(sym)) {
      this.formError.set(`Symbol "${sym}" not found.`);
      return;
    }
    if (this.newPrice() <= 0) {
      this.formError.set('Enter a target price greater than zero.');
      return;
    }
    this.formError.set('');
    this.alerts.create(sym, this.newCondition(), this.newPrice());
    this.newSymbol.set('');
    this.newPrice.set(0);
  }

  protected formatDate(d: Date): string {
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  }
}
