import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { PortfolioService } from '../../core/services/portfolio.service';
import { MarketDataService } from '../../core/services/market-data.service';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { PercentFormatPipe } from '../../shared/pipes/percent-format.pipe';
import { PriceChangeComponent } from '../../shared/components/price-change/price-change.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

type Period = '1D' | '1W' | '1M' | '3M' | '1Y' | '3Y' | 'ALL';

const DAYS_MAP: Record<Exclude<Period, 'ALL'>, number> = {
  '1D': 1, '1W': 7, '1M': 30, '3M': 90, '1Y': 365, '3Y': 1095,
};

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CurrencyFormatPipe, PercentFormatPipe, PriceChangeComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <span class="eyebrow">Analytics</span>
          <h1 class="page-title">Trading Performance</h1>
          <p class="page-sub">Analyse your trade history and portfolio composition.</p>
        </div>
        <div class="range-tabs" role="tablist">
          @for (p of periods; track p) {
            <button
              class="range-tab"
              role="tab"
              [class.is-active]="period() === p"
              [attr.aria-selected]="period() === p"
              (click)="period.set(p)"
            >{{ p }}</button>
          }
        </div>
      </header>

      <!-- Summary metrics -->
      <section class="summary-grid">
        <article class="summary-card">
          <div class="card-header">
            <span class="card-title">Total Trades</span>
            <span class="card-icon"><app-icon name="trade" [size]="14"/></span>
          </div>
          <div class="metric">
            <span class="metric-value">{{ totalTrades() }}</span>
          </div>
          <div class="metric-sub">
            <span class="text-green">{{ buyCount() }} buys</span>
            &nbsp;·&nbsp;
            <span class="text-red">{{ sellCount() }} sells</span>
          </div>
        </article>

        <article class="summary-card">
          <div class="card-header">
            <span class="card-title">Win Rate</span>
            <span class="card-icon"><app-icon name="achievements" [size]="14"/></span>
          </div>
          <div class="metric">
            <span class="metric-value">{{ portfolioSummary().winRate | percentFmt:{ signed: false } }}</span>
          </div>
          <div class="metric-sub">
            {{ portfolioSummary().totalTrades }} filled trades all-time
          </div>
        </article>

        <article class="summary-card">
          <div class="card-header">
            <span class="card-title">Volume Traded</span>
            <span class="card-icon"><app-icon name="analytics" [size]="14"/></span>
          </div>
          <div class="metric">
            <span class="metric-value">{{ totalVolume() | currencyFmt }}</span>
          </div>
          <div class="metric-sub">in the selected period</div>
        </article>

        <article class="summary-card">
          <div class="card-header">
            <span class="card-title">Avg Trade Size</span>
            <span class="card-icon"><app-icon name="portfolio" [size]="14"/></span>
          </div>
          <div class="metric">
            <span class="metric-value">{{ avgTradeSize() | currencyFmt }}</span>
          </div>
          <div class="metric-sub">per executed order</div>
        </article>
      </section>

      <!-- Two-column layout -->
      <section class="analytics-grid">
        <div class="col-main">
          <!-- Unrealised P&L by holding -->
          <article class="card">
            <header class="card-header">
              <span class="card-title">Unrealised P&amp;L by Position</span>
              <span class="card-subtitle text-secondary">{{ holdings().length }} open positions</span>
            </header>
            @if (holdings().length === 0) {
              <p class="empty-msg">No open positions.</p>
            } @else {
              <div class="table-wrap">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th class="num">Qty</th>
                      <th class="num">Avg Cost</th>
                      <th class="num">Current</th>
                      <th class="num">Market Value</th>
                      <th class="num">P&amp;L</th>
                      <th class="num">P&amp;L %</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (h of holdings(); track h.symbol) {
                      <tr>
                        <td><span class="symbol-tag">{{ h.symbol }}</span></td>
                        <td class="num">{{ h.quantity }}</td>
                        <td class="num">{{ h.averagePrice | currencyFmt }}</td>
                        <td class="num">{{ h.currentPrice | currencyFmt }}</td>
                        <td class="num font-mono">{{ h.marketValue | currencyFmt }}</td>
                        <td class="num font-mono"
                          [class.text-green]="h.unrealizedPnL >= 0"
                          [class.text-red]="h.unrealizedPnL < 0">
                          {{ h.unrealizedPnL | currencyFmt:{ signed: true } }}
                        </td>
                        <td class="num">
                          <app-price-change [value]="h.unrealizedPnLPercent" mode="percent"/>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </article>

          <!-- Symbol activity table -->
          <article class="card">
            <header class="card-header">
              <span class="card-title">Activity by Symbol</span>
              <span class="card-subtitle text-secondary">{{ period() }} period</span>
            </header>
            @if (symbolStats().length === 0) {
              <p class="empty-msg">No trades in this period.</p>
            } @else {
              <div class="table-wrap">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th class="num">Trades</th>
                      <th class="num">Buys</th>
                      <th class="num">Sells</th>
                      <th class="num">Volume</th>
                      <th>Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (s of symbolStats(); track s.symbol) {
                      <tr>
                        <td><span class="symbol-tag">{{ s.symbol }}</span></td>
                        <td class="num">{{ s.count }}</td>
                        <td class="num text-green">{{ s.buyCount }}</td>
                        <td class="num text-red">{{ s.sellCount }}</td>
                        <td class="num font-mono">{{ s.volume | currencyFmt }}</td>
                        <td>
                          <div class="activity-bar">
                            <div class="bar-buy" [style.width.%]="buyPct(s)"></div>
                            <div class="bar-sell" [style.width.%]="sellPct(s)"></div>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </article>
        </div>

        <aside class="col-side">
          <!-- Portfolio total P&L -->
          <article class="summary-card pnl-card">
            <div class="card-header">
              <span class="card-title">Total Unrealised P&amp;L</span>
            </div>
            <div class="metric">
              <span class="metric-value"
                [class.text-green]="totalPnL() >= 0"
                [class.text-red]="totalPnL() < 0">
                {{ totalPnL() | currencyFmt:{ signed: true } }}
              </span>
            </div>
            <div class="metric-sub">
              across all open positions
            </div>
          </article>

          <!-- Best performers -->
          <article class="card">
            <header class="card-header">
              <span class="card-title">Best Performers</span>
            </header>
            <ul class="performers-list">
              @for (h of bestPerformers(); track h.symbol) {
                <li class="performer-row">
                  <span class="symbol-tag">{{ h.symbol }}</span>
                  <span class="truncate performer-name">{{ h.name }}</span>
                  <app-price-change [value]="h.unrealizedPnLPercent" mode="percent"/>
                </li>
              }
            </ul>
          </article>

          <!-- Worst performers -->
          <article class="card">
            <header class="card-header">
              <span class="card-title">Worst Performers</span>
            </header>
            <ul class="performers-list">
              @for (h of worstPerformers(); track h.symbol) {
                <li class="performer-row">
                  <span class="symbol-tag">{{ h.symbol }}</span>
                  <span class="truncate performer-name">{{ h.name }}</span>
                  <app-price-change [value]="h.unrealizedPnLPercent" mode="percent"/>
                </li>
              }
            </ul>
          </article>
        </aside>
      </section>
    </div>
  `,
  styleUrl: './analytics.component.css',
})
export class AnalyticsComponent {
  private readonly portfolio = inject(PortfolioService);
  private readonly market = inject(MarketDataService);

  protected readonly periods: Period[] = ['1D', '1W', '1M', '3M', '1Y', '3Y', 'ALL'];
  protected readonly period = signal<Period>('1M');

  protected readonly filteredTrades = computed(() => {
    const trades = this.portfolio.trades().filter(t => t.status === 'FILLED');
    const p = this.period();
    if (p === 'ALL') return trades;
    const cutoff = Date.now() - DAYS_MAP[p] * 86_400_000;
    return trades.filter(t => t.timestamp.getTime() >= cutoff);
  });

  protected readonly totalTrades = computed(() => this.filteredTrades().length);

  protected readonly buyCount = computed(() =>
    this.filteredTrades().filter(t => t.side === 'BUY').length,
  );

  protected readonly sellCount = computed(() =>
    this.filteredTrades().filter(t => t.side === 'SELL').length,
  );

  protected readonly totalVolume = computed(() =>
    this.filteredTrades().reduce((s, t) => s + t.total, 0),
  );

  protected readonly avgTradeSize = computed(() => {
    const n = this.totalTrades();
    return n > 0 ? this.totalVolume() / n : 0;
  });

  protected readonly symbolStats = computed(() => {
    const map = new Map<string, { count: number; buyCount: number; sellCount: number; volume: number }>();
    for (const t of this.filteredTrades()) {
      const e = map.get(t.symbol) ?? { count: 0, buyCount: 0, sellCount: 0, volume: 0 };
      map.set(t.symbol, {
        count: e.count + 1,
        buyCount: e.buyCount + (t.side === 'BUY' ? 1 : 0),
        sellCount: e.sellCount + (t.side === 'SELL' ? 1 : 0),
        volume: e.volume + t.total,
      });
    }
    return [...map.entries()]
      .map(([symbol, s]) => ({ symbol, ...s }))
      .sort((a, b) => b.volume - a.volume);
  });

  protected readonly holdings = this.portfolio.holdings;
  protected readonly portfolioSummary = this.portfolio.summary;

  protected readonly totalPnL = computed(() =>
    this.holdings().reduce((s, h) => s + h.unrealizedPnL, 0),
  );

  protected readonly bestPerformers = computed(() =>
    [...this.holdings()].sort((a, b) => b.unrealizedPnLPercent - a.unrealizedPnLPercent).slice(0, 5),
  );

  protected readonly worstPerformers = computed(() =>
    [...this.holdings()].sort((a, b) => a.unrealizedPnLPercent - b.unrealizedPnLPercent).slice(0, 5),
  );

  protected buyPct(s: { buyCount: number; count: number }): number {
    return s.count > 0 ? (s.buyCount / s.count) * 100 : 0;
  }

  protected sellPct(s: { sellCount: number; count: number }): number {
    return s.count > 0 ? (s.sellCount / s.count) * 100 : 0;
  }
}
