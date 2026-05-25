import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PortfolioService } from '../../core/services/portfolio.service';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { PriceChangeComponent } from '../../shared/components/price-change/price-change.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [RouterLink, CurrencyFormatPipe, PriceChangeComponent, IconComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <span class="eyebrow">Portfolio</span>
          <h1 class="page-title">Your Holdings</h1>
          <p class="page-sub">{{ holdings().length }} positions worth {{ summary().holdingsValue | currencyFmt }}</p>
        </div>
        <div class="page-actions">
          <a routerLink="/markets" class="btn btn-primary">
            <app-icon name="plus" [size]="14"/>
            Add position
          </a>
        </div>
      </header>

      <!-- Quick metrics -->
      <section class="metrics">
        <div class="metric-tile">
          <span class="card-title">Holdings value</span>
          <span class="metric-num">{{ summary().holdingsValue | currencyFmt }}</span>
        </div>
        <div class="metric-tile">
          <span class="card-title">Total cost basis</span>
          <span class="metric-num">{{ costBasis() | currencyFmt }}</span>
        </div>
        <div class="metric-tile">
          <span class="card-title">Unrealized P&L</span>
          <span class="metric-num" [class.text-green]="summary().totalPnL >= 0" [class.text-red]="summary().totalPnL < 0">
            {{ summary().totalPnL | currencyFmt:{ signed: true } }}
          </span>
          <app-price-change [value]="summary().totalPnLPercent" mode="percent"/>
        </div>
        <div class="metric-tile">
          <span class="card-title">Cash available</span>
          <span class="metric-num">{{ summary().cashBalance | currencyFmt }}</span>
        </div>
      </section>

      <article class="card no-pad">
        @if (holdings().length === 0) {
          <app-empty-state
            title="No open positions"
            description="Browse markets and place your first trade to start building your portfolio."
          >
            <a routerLink="/markets" class="btn btn-primary" style="margin-top: var(--space-3)">Browse markets</a>
          </app-empty-state>
        } @else {
          <div class="table-wrap">
            <table class="table portfolio-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Name</th>
                  <th class="num">Quantity</th>
                  <th class="num">Avg Cost</th>
                  <th class="num">Current</th>
                  <th class="num">Market Value</th>
                  <th class="num">Unrealized P&L</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (h of holdings(); track h.symbol) {
                  <tr>
                    <td><span class="symbol-tag">{{ h.symbol }}</span></td>
                    <td class="text-secondary truncate" style="max-width: 220px;">{{ h.name }}</td>
                    <td class="num font-mono">{{ formatQty(h.quantity) }}</td>
                    <td class="num font-mono text-secondary">{{ h.averagePrice | currencyFmt }}</td>
                    <td class="num font-mono">{{ h.currentPrice | currencyFmt }}</td>
                    <td class="num font-mono">{{ h.marketValue | currencyFmt }}</td>
                    <td class="num">
                      <div class="pnl-stack">
                        <span class="pnl-amt" [class.text-green]="h.unrealizedPnL >= 0" [class.text-red]="h.unrealizedPnL < 0">
                          {{ h.unrealizedPnL | currencyFmt:{ signed: true } }}
                        </span>
                        <app-price-change [value]="h.unrealizedPnLPercent" mode="percent"/>
                      </div>
                    </td>
                    <td class="actions-cell">
                      <a [routerLink]="['/trade', h.symbol]" class="btn btn-secondary btn-sm">Trade</a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </article>
    </div>
  `,
  styleUrl: './portfolio.component.css',
})
export class PortfolioComponent {
  private readonly portfolio = inject(PortfolioService);

  protected readonly holdings = this.portfolio.holdings;
  protected readonly summary = this.portfolio.summary;

  protected costBasis(): number {
    return this.holdings().reduce((s, h) => s + h.averagePrice * h.quantity, 0);
  }

  protected formatQty(q: number): string {
    if (q < 1) return q.toFixed(4);
    if (q < 100) return q.toFixed(2);
    return q.toFixed(0);
  }
}
