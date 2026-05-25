import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PortfolioService } from '../../core/services/portfolio.service';
import { MarketDataService } from '../../core/services/market-data.service';
import { AuthService } from '../../core/services/auth.service';
import { SparklineComponent } from '../../shared/components/sparkline/sparkline.component';
import { PriceChangeComponent } from '../../shared/components/price-change/price-change.component';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { PercentFormatPipe } from '../../shared/pipes/percent-format.pipe';
import { CompactNumberPipe } from '../../shared/pipes/compact-number.pipe';
import { IconComponent } from '../../shared/components/icon/icon.component';

type Range = '1D' | '1W' | '1M' | '3M' | '1Y' | '3Y' | 'ALL';

// Points to generate and how far back the start drifts (as fraction of end value)
const RANGE_CFG: Record<Range, { points: number; drift: number }> = {
  '1D':  { points: 24,  drift: 0.008 },
  '1W':  { points: 35,  drift: 0.028 },
  '1M':  { points: 30,  drift: 0.065 },
  '3M':  { points: 45,  drift: 0.130 },
  '1Y':  { points: 52,  drift: 0.220 },
  '3Y':  { points: 60,  drift: 0.480 },
  'ALL': { points: 60,  drift: 0.700 },
};

function buildPeriodSeries(endValue: number, range: Range, baseSeed: number): number[] {
  const { points, drift } = RANGE_CFG[range];
  let s = baseSeed;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };

  const startValue = endValue * (1 - drift * (0.85 + rand() * 0.3));
  const noiseAmp = endValue * 0.004 * (1 + drift * 2);
  const data: number[] = [];

  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const base = startValue + (endValue - startValue) * t;
    data.push(+(base + (rand() - 0.5) * noiseAmp * 2).toFixed(2));
  }
  data[0] = +startValue.toFixed(2);
  data[points - 1] = +endValue.toFixed(2);
  return data;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    SparklineComponent,
    PriceChangeComponent,
    CurrencyFormatPipe,
    PercentFormatPipe,
    CompactNumberPipe,
    IconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <!-- Page header -->
      <header class="page-head">
        <div>
          <span class="eyebrow">Dashboard</span>
          <h1 class="page-title">Good {{ greeting() }}, {{ firstName() }}</h1>
          <p class="page-sub">Here's how your portfolio is performing today.</p>
        </div>
        <div class="page-actions">
          <a routerLink="/markets" class="btn btn-secondary">
            <app-icon name="markets" [size]="14"/>
            Explore markets
          </a>
          <a routerLink="/trade/AAPL" class="btn btn-primary">
            <app-icon name="plus" [size]="14"/>
            New trade
          </a>
        </div>
      </header>

      <!-- Summary cards -->
      <section class="summary-grid">
        <article class="summary-card" aria-labelledby="sum-total">
          <div class="card-header">
            <span class="card-title" id="sum-total">Total Value</span>
            <span class="card-icon"><app-icon name="portfolio" [size]="14"/></span>
          </div>
          <div class="metric">
            <span class="metric-value">{{ summary().totalValue | currencyFmt }}</span>
            <app-price-change [value]="summary().totalPnLPercent" mode="percent"/>
          </div>
          <div class="metric-sub">
            All-time P&L
            <span class="tabular" [class.text-green]="summary().totalPnL >= 0" [class.text-red]="summary().totalPnL < 0">
              {{ summary().totalPnL | currencyFmt:{ signed: true } }}
            </span>
          </div>
        </article>

        <article class="summary-card" aria-labelledby="sum-daily">
          <div class="card-header">
            <span class="card-title" id="sum-daily">Today's P&L</span>
            <span class="card-icon"><app-icon name="analytics" [size]="14"/></span>
          </div>
          <div class="metric">
            <span class="metric-value" [class.text-green]="summary().dailyPnL >= 0" [class.text-red]="summary().dailyPnL < 0">
              {{ summary().dailyPnL | currencyFmt:{ signed: true } }}
            </span>
            <app-price-change [value]="summary().dailyPnLPercent" mode="percent"/>
          </div>
          <div class="metric-sub">
            Best performer:
            <strong class="text-primary">{{ bestPerformer()?.symbol ?? '—' }}</strong>
            @if (bestPerformer()) {
              <app-price-change [value]="bestPerformer()!.changePercent" mode="percent"/>
            }
          </div>
        </article>

        <article class="summary-card" aria-labelledby="sum-cash">
          <div class="card-header">
            <span class="card-title" id="sum-cash">Buying Power</span>
            <span class="card-icon"><app-icon name="trade" [size]="14"/></span>
          </div>
          <div class="metric">
            <span class="metric-value">{{ summary().cashBalance | currencyFmt }}</span>
          </div>
          <div class="metric-sub">
            Holdings value
            <span class="tabular text-primary">{{ summary().holdingsValue | currencyFmt }}</span>
          </div>
        </article>

        <article class="summary-card" aria-labelledby="sum-winrate">
          <div class="card-header">
            <span class="card-title" id="sum-winrate">Win Rate</span>
            <span class="card-icon"><app-icon name="achievements" [size]="14"/></span>
          </div>
          <div class="metric">
            <span class="metric-value">{{ summary().winRate | percentFmt:{ signed: false } }}</span>
          </div>
          <div class="metric-sub">
            {{ summary().totalTrades }} executed trades
          </div>
        </article>
      </section>

      <!-- Two-column layout -->
      <section class="dashboard-grid">
        <div class="col-main">
          <!-- Portfolio chart -->
          <article class="card big-chart-card">
            <header class="card-header">
              <div>
                <span class="card-title">Portfolio Performance</span>
                <h3 class="big-chart-value">{{ summary().totalValue | currencyFmt }}</h3>
                <div class="big-chart-meta">
                  <app-price-change [value]="periodChange()" mode="currency"/>
                  <span class="text-muted">{{ selectedRange() }}</span>
                </div>
              </div>
              <div class="range-tabs" role="tablist">
                @for (r of ranges; track r) {
                  <button
                    class="range-tab"
                    role="tab"
                    [class.is-active]="selectedRange() === r"
                    [attr.aria-selected]="selectedRange() === r"
                    (click)="selectedRange.set(r)"
                  >{{ r }}</button>
                }
              </div>
            </header>
            <div class="big-chart-area">
              <app-sparkline [data]="portfolioSeries()" [width]="640" [height]="180" trend="auto"/>
            </div>
          </article>

          <!-- Recent trades -->
          <article class="card">
            <header class="card-header">
              <span class="card-title">Recent Trades</span>
              <a routerLink="/orders" class="card-link">View all</a>
            </header>
            <div class="table-wrap">
              <table class="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Symbol</th>
                    <th>Side</th>
                    <th>Type</th>
                    <th class="num">Qty</th>
                    <th class="num">Price</th>
                    <th class="num">Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (t of recentTrades(); track t.id) {
                    <tr>
                      <td class="text-secondary">{{ formatTime(t.timestamp) }}</td>
                      <td><span class="symbol-tag">{{ t.symbol }}</span></td>
                      <td>
                        <span class="badge" [class.badge-green]="t.side === 'BUY'" [class.badge-red]="t.side === 'SELL'">
                          {{ t.side }}
                        </span>
                      </td>
                      <td class="text-secondary">{{ t.type }}</td>
                      <td class="num">{{ t.quantity }}</td>
                      <td class="num">{{ t.price | currencyFmt }}</td>
                      <td class="num font-mono">{{ t.total | currencyFmt }}</td>
                      <td>
                        <span class="badge"
                          [class.badge-green]="t.status === 'FILLED'"
                          [class.badge-yellow]="t.status === 'PENDING'"
                          [class.badge-neutral]="t.status === 'CANCELLED'"
                          [class.badge-red]="t.status === 'REJECTED'"
                        >{{ t.status }}</span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </article>
        </div>

        <aside class="col-side">
          <!-- Market movers -->
          <article class="card">
            <header class="card-header">
              <span class="card-title">Top Gainers</span>
              <a routerLink="/markets" class="card-link">All</a>
            </header>
            <ul class="mover-list">
              @for (a of gainers(); track a.symbol) {
                <li>
                  <a [routerLink]="['/trade', a.symbol]" class="mover-row">
                    <span class="mover-meta">
                      <span class="symbol-tag">{{ a.symbol }}</span>
                      <span class="mover-name truncate">{{ a.name }}</span>
                    </span>
                    <span class="mover-price">{{ a.price | currencyFmt }}</span>
                    <app-price-change [value]="a.changePercent" mode="percent"/>
                  </a>
                </li>
              }
            </ul>
          </article>

          <!-- Top losers -->
          <article class="card">
            <header class="card-header">
              <span class="card-title">Top Losers</span>
              <a routerLink="/markets" class="card-link">All</a>
            </header>
            <ul class="mover-list">
              @for (a of losers(); track a.symbol) {
                <li>
                  <a [routerLink]="['/trade', a.symbol]" class="mover-row">
                    <span class="mover-meta">
                      <span class="symbol-tag">{{ a.symbol }}</span>
                      <span class="mover-name truncate">{{ a.name }}</span>
                    </span>
                    <span class="mover-price">{{ a.price | currencyFmt }}</span>
                    <app-price-change [value]="a.changePercent" mode="percent"/>
                  </a>
                </li>
              }
            </ul>
          </article>

          <!-- Most active -->
          <article class="card">
            <header class="card-header">
              <span class="card-title">Most Active</span>
              <a routerLink="/markets" class="card-link">All</a>
            </header>
            <ul class="mover-list">
              @for (a of mostActive(); track a.symbol) {
                <li>
                  <a [routerLink]="['/trade', a.symbol]" class="mover-row">
                    <span class="mover-meta">
                      <span class="symbol-tag">{{ a.symbol }}</span>
                      <span class="mover-name truncate">Vol {{ a.volume | compactNumber }}</span>
                    </span>
                    <span class="mover-price">{{ a.price | currencyFmt }}</span>
                    <app-price-change [value]="a.changePercent" mode="percent"/>
                  </a>
                </li>
              }
            </ul>
          </article>
        </aside>
      </section>
    </div>
  `,
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private readonly portfolio = inject(PortfolioService);
  private readonly market = inject(MarketDataService);
  private readonly auth = inject(AuthService);

  protected readonly summary = this.portfolio.summary;
  protected readonly gainers = this.market.topGainers;
  protected readonly losers = this.market.topLosers;
  protected readonly mostActive = this.market.mostActive;

  protected readonly ranges: Range[] = ['1D', '1W', '1M', '3M', '1Y', '3Y', 'ALL'];
  protected readonly selectedRange = signal<Range>('1M');

  protected readonly recentTrades = computed(() => this.portfolio.trades().slice(0, 6));

  protected readonly bestPerformer = computed(() => {
    const holdings = this.portfolio.holdings();
    if (holdings.length === 0) return null;
    const top = [...holdings].sort((a, b) => b.unrealizedPnLPercent - a.unrealizedPnLPercent)[0];
    const asset = this.market.getBySymbol(top.symbol);
    return asset ? { symbol: top.symbol, changePercent: asset.changePercent } : null;
  });

  protected readonly portfolioSeries = computed(() => {
    const end = this.summary().totalValue;
    // Use a seed that changes with the range so each period looks distinct
    const rangeSeed = this.selectedRange().split('').reduce((s, c) => s + c.charCodeAt(0), 7331);
    return buildPeriodSeries(end, this.selectedRange(), rangeSeed);
  });

  protected readonly periodChange = computed(() => {
    const series = this.portfolioSeries();
    if (series.length < 2) return 0;
    return +(series[series.length - 1] - series[0]).toFixed(2);
  });

  protected readonly firstName = computed(() => {
    const u = this.auth.user();
    return u ? u.displayName.split(' ')[0] : 'Trader';
  });

  protected readonly greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 18) return 'afternoon';
    return 'evening';
  });

  protected formatTime(d: Date): string {
    const diff = Date.now() - d.getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }
}
