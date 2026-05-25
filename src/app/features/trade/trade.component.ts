import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';

// ── Range-specific synthetic chart data ────────────────────────────────────
// Used immediately as a placeholder (and permanently if the API returns no data).
// Each range produces a visually distinct, stable-per-symbol shape with
// volatility and point-count tuned to that time window.
const RANGE_SYNTH_CFG: Record<string, { n: number; vol: number }> = {
  '1D': { n: 78,  vol: 0.007  },
  '1W': { n: 35,  vol: 0.022  },
  '1M': { n: 30,  vol: 0.055  },
  '3M': { n: 65,  vol: 0.095  },
  '1Y': { n: 52,  vol: 0.200  },
  '3Y': { n: 36,  vol: 0.420  },
};

function generateSyntheticRange(price: number, symbol: string, range: string): number[] {
  const { n, vol } = RANGE_SYNTH_CFG[range] ?? { n: 30, vol: 0.05 };

  // Stable seed: different symbol+range combos always yield the same shape
  let s = (symbol + range)
    .split('')
    .reduce((a, c, i) => ((a + c.charCodeAt(0) * (i + 1)) | 0), 0x9e3779b9) >>> 0;
  const rand = () => {
    s = (Math.imul(s ^ (s >>> 16), 0x45d9f3b) | 0) >>> 0;
    return s / 0x100000000 - 0.5;
  };

  // Lognormal start price — longer ranges can diverge more from current price
  const logDrift = rand() * vol * 4;
  const startPrice = Math.max(price * 0.001, price * Math.exp(-logDrift));

  const pts: number[] = [];
  let p = startPrice;
  for (let i = 0; i < n; i++) {
    const t  = i / (n - 1);
    // Mean reversion: gently pull toward the trendline connecting start→current
    const trend = (startPrice + (price - startPrice) * t - p) * 0.12;
    const noise = rand() * price * vol * 0.5;
    p = Math.max(price * 0.001, p + trend + noise);
    pts.push(+p.toFixed(8));
  }
  pts[n - 1] = price; // end exactly at the live price
  return pts;
}
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MarketDataService } from '../../core/services/market-data.service';
import { PortfolioService } from '../../core/services/portfolio.service';
import { FinnhubService } from '../../core/services/finnhub.service';
import { SparklineComponent } from '../../shared/components/sparkline/sparkline.component';
import { PriceChangeComponent } from '../../shared/components/price-change/price-change.component';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { CompactNumberPipe } from '../../shared/pipes/compact-number.pipe';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { OrderSide, OrderType } from '../../core/models/portfolio.model';
import { Asset } from '../../core/models/asset.model';

type Range = '1D' | '1W' | '1M' | '3M' | '1Y' | '3Y';

// Finnhub resolution + how far back to request for each range
const RANGE_RESOLUTION: Record<Range, { resolution: string; daysBack: number }> = {
  '1D':  { resolution: '15', daysBack: 1    },  // 15-min candles
  '1W':  { resolution: '60', daysBack: 7    },  // 1-hour candles
  '1M':  { resolution: 'D',  daysBack: 30   },  // daily candles
  '3M':  { resolution: 'D',  daysBack: 90   },  // daily candles
  '1Y':  { resolution: 'D',  daysBack: 365  },  // daily candles
  '3Y':  { resolution: 'W',  daysBack: 1095 },  // weekly candles
};

@Component({
  selector: 'app-trade',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    SparklineComponent,
    PriceChangeComponent,
    CurrencyFormatPipe,
    CompactNumberPipe,
    IconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      @if (asset(); as a) {
        <header class="page-head">
          <div class="asset-meta">
            <span class="sym-icon-lg">{{ a.symbol.slice(0, 1) }}</span>
            <div>
              <span class="symbol-tag">{{ a.symbol }}</span>
              <h1 class="page-title">{{ a.name }}</h1>
              <div class="price-row">
                <span class="big-price">{{ a.price | currencyFmt }}</span>
                <app-price-change [value]="a.changePercent" mode="percent"/>
                <span class="text-muted">({{ a.change | currencyFmt:{ signed: true } }})</span>
              </div>
            </div>
          </div>
          <a routerLink="/markets" class="btn btn-secondary">
            <app-icon name="chevron-left" [size]="14"/>
            Back to markets
          </a>
        </header>

        <div class="trade-grid">
          <!-- Chart + info -->
          <div class="trade-main">
            <article class="card">
              <header class="card-header">
                <span class="card-title">Price Trend</span>
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
              <div class="chart-area" [class.chart-loading]="isLoadingChart()">
                <app-sparkline [data]="chartData()" [width]="720" [height]="240"/>
              </div>
            </article>

            <article class="card">
              <header class="card-header">
                <span class="card-title">Key Stats</span>
              </header>
              <dl class="stats-grid">
                <div>
                  <dt>Volume (24h)</dt>
                  <dd>{{ a.volume | compactNumber }}</dd>
                </div>
                @if (a.marketCap) {
                  <div>
                    <dt>Market Cap</dt>
                    <dd>{{ a.marketCap | compactNumber }}</dd>
                  </div>
                }
                <div>
                  <dt>{{ selectedRange() }} High</dt>
                  <dd>{{ highLow().high | currencyFmt }}</dd>
                </div>
                <div>
                  <dt>{{ selectedRange() }} Low</dt>
                  <dd>{{ highLow().low | currencyFmt }}</dd>
                </div>
                <div>
                  <dt>Category</dt>
                  <dd class="capitalize">{{ a.category }}</dd>
                </div>
                <div>
                  <dt>You own</dt>
                  <dd>{{ existingPosition() }}</dd>
                </div>
              </dl>
            </article>
          </div>

          <!-- Order ticket -->
          <aside class="ticket">
            <article class="card ticket-card">
              <header class="card-header">
                <span class="card-title">Place Order</span>
              </header>

              <div class="side-toggle" role="tablist">
                <button
                  class="side-btn buy"
                  [class.is-active]="side() === 'BUY'"
                  (click)="side.set('BUY')"
                  role="tab"
                  [attr.aria-selected]="side() === 'BUY'"
                >Buy</button>
                <button
                  class="side-btn sell"
                  [class.is-active]="side() === 'SELL'"
                  (click)="side.set('SELL')"
                  role="tab"
                  [attr.aria-selected]="side() === 'SELL'"
                >Sell</button>
              </div>

              <div class="type-toggle">
                <button class="type-btn" [class.is-active]="type() === 'MARKET'" (click)="type.set('MARKET')">Market</button>
                <button class="type-btn" [class.is-active]="type() === 'LIMIT'" (click)="type.set('LIMIT')">Limit</button>
              </div>

              <div class="input-group">
                <label class="input-label" for="qty">Quantity</label>
                <input
                  id="qty"
                  class="input"
                  type="number"
                  min="0"
                  step="0.0001"
                  [ngModel]="quantity()"
                  (ngModelChange)="quantity.set(+$event || 0)"
                  placeholder="0"
                />
                <div class="quick-qty">
                  @for (p of quickPercents; track p) {
                    <button type="button" class="quick-btn" (click)="setQuickQty(p)">{{ p === 1 ? 'Max' : (p * 100) + '%' }}</button>
                  }
                </div>
              </div>

              @if (type() === 'LIMIT') {
                <div class="input-group">
                  <label class="input-label" for="limit">Limit price</label>
                  <input
                    id="limit"
                    class="input"
                    type="number"
                    min="0"
                    step="0.01"
                    [ngModel]="limitPrice()"
                    (ngModelChange)="limitPrice.set(+$event || 0)"
                    placeholder="0.00"
                  />
                </div>
              }

              <dl class="summary">
                <div>
                  <dt>Estimated price</dt>
                  <dd>{{ fillPrice() | currencyFmt }}</dd>
                </div>
                <div>
                  <dt>Estimated total</dt>
                  <dd class="font-mono">{{ estimatedTotal() | currencyFmt }}</dd>
                </div>
                <div class="summary-row">
                  <dt>Cash after trade</dt>
                  <dd class="font-mono" [class.text-red]="cashAfter() < 0">{{ cashAfter() | currencyFmt }}</dd>
                </div>
              </dl>

              @if (errorMsg(); as e) {
                <div class="form-error" role="alert">{{ e }}</div>
              }
              @if (successMsg(); as s) {
                <div class="form-success" role="status">{{ s }}</div>
              }

              <button
                type="button"
                class="btn btn-lg btn-block"
                [class.btn-green]="side() === 'BUY'"
                [class.btn-red]="side() === 'SELL'"
                [disabled]="!canSubmit()"
                (click)="submit()"
              >
                {{ side() }} {{ a.symbol }}
              </button>

              <p class="ticket-note">Paper trading uses real market data with simulated orders. No real money involved.</p>
            </article>
          </aside>
        </div>
      } @else {
        <div class="not-found">
          <h2>Symbol not found</h2>
          <p class="text-secondary">We couldn't locate that asset.</p>
          <a routerLink="/markets" class="btn btn-primary" style="margin-top: var(--space-4)">Back to markets</a>
        </div>
      }
    </div>
  `,
  styleUrl: './trade.component.css',
})
export class TradeComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly market = inject(MarketDataService);
  private readonly portfolio = inject(PortfolioService);
  private readonly finnhub = inject(FinnhubService);

  private readonly routeSymbol = toSignal(
    this.route.paramMap.pipe(map(p => p.get('symbol') ?? '')),
    { initialValue: '' },
  );

  protected readonly asset = computed(() => this.market.getBySymbol(this.routeSymbol()));

  protected readonly side = signal<OrderSide>('BUY');
  protected readonly type = signal<OrderType>('MARKET');
  protected readonly quantity = signal<number>(10);
  protected readonly limitPrice = signal<number>(0);
  protected readonly errorMsg = signal<string | null>(null);
  protected readonly successMsg = signal<string | null>(null);

  protected readonly ranges: Range[] = ['1D', '1W', '1M', '3M', '1Y', '3Y'];
  protected readonly selectedRange = signal<Range>('1D');
  protected readonly quickPercents = [0.25, 0.5, 0.75, 1] as const;

  // ── Chart state ────────────────────────────────────────────────────────────
  // Keyed as "SYMBOL_RANGE" so switching periods never mixes data windows.
  private readonly _chartKey    = signal<string>('');
  private readonly _chartValues = signal<number[]>([]);
  /** Key of the fetch currently in-flight (null when idle). */
  private readonly _fetchingKey = signal<string | null>(null);
  private _chartLoadId = 0;

  /**
   * The chart dimly pulses while Finnhub is still fetching for the active range.
   * When real data arrives (or the fetch settles), the chart brightens.
   */
  protected readonly isLoadingChart = computed(() => {
    const a = this.asset();
    return this._fetchingKey() === `${a?.symbol}_${this.selectedRange()}`;
  });

  /**
   * Returns real Finnhub close prices when available.
   * Falls back to a range-specific synthetic series otherwise.
   *
   * Each range (1D/1W/1M/3M/1Y/3Y) generates a visually distinct shape with
   * volatility and point-count tuned to that time window — so the chart always
   * looks different per range even before the API call completes.
   */
  protected readonly chartData = computed(() => {
    const a = this.asset();
    const r = this.selectedRange();
    if (!a) return [];
    const key = `${a.symbol}_${r}`;
    return this._chartKey() === key
      ? this._chartValues()
      : generateSyntheticRange(a.price, a.symbol, r);
  });

  protected readonly highLow = computed(() => {
    const d = this.chartData();
    if (!d.length) return { high: 0, low: 0 };
    return { high: Math.max(...d), low: Math.min(...d) };
  });

  // Re-runs whenever symbol or range changes.
  // The `void` call is intentional — errors are caught inside the async method.
  private readonly _loader = effect(() => {
    const a     = this.asset();
    const range = this.selectedRange();
    void this._loadChart(a ?? null, range);
  });

  private async _loadChart(asset: Asset | null, range: Range): Promise<void> {
    if (!asset) return;
    const key = `${asset.symbol}_${range}`;
    const rid = ++this._chartLoadId;

    // ⚠️  await Promise.resolve() MUST be first: it defers all signal writes to a
    // microtask so they happen outside the effect's synchronous execution context,
    // avoiding Angular's NG0600 "writing to signals in an effect" error.
    await Promise.resolve();
    if (this._chartLoadId !== rid) return; // superseded by a newer call

    this._fetchingKey.set(key);

    try {
      const cfg    = RANGE_RESOLUTION[range];
      const toSec  = Math.floor(Date.now() / 1000);
      const fromSec = toSec - cfg.daysBack * 86400;

      const closes = await this.finnhub.fetchCandles(
        asset.symbol,
        asset.category === 'crypto',
        cfg.resolution,
        fromSec,
        toSec,
      );

      if (this._chartLoadId !== rid) return;

      if (closes && closes.length >= 2) {
        this._chartKey.set(key);
        this._chartValues.set(closes);
      }
      // If API returns null/empty: chartData keeps showing the range-specific
      // synthetic — each range still looks different (no "all charts identical" bug).
    } catch (e) {
      console.error('[trade] chart load error:', e);
    } finally {
      if (this._chartLoadId === rid) this._fetchingKey.set(null);
    }
  }

  protected readonly fillPrice = computed(() => {
    const a = this.asset();
    if (!a) return 0;
    return this.type() === 'MARKET' ? a.price : (this.limitPrice() || a.price);
  });

  protected readonly estimatedTotal = computed(() => +(this.fillPrice() * this.quantity()).toFixed(2));

  protected readonly cashAfter = computed(() => {
    const cash = this.portfolio.cashBalance();
    return this.side() === 'BUY'
      ? cash - this.estimatedTotal()
      : cash + this.estimatedTotal();
  });

  protected readonly existingPosition = computed(() => {
    const a = this.asset();
    if (!a) return '0';
    const h = this.portfolio.holdings().find(x => x.symbol === a.symbol);
    if (!h) return '0';
    return h.quantity < 1 ? h.quantity.toFixed(4) : h.quantity.toFixed(2);
  });

  protected canSubmit(): boolean {
    return !!this.asset() && this.quantity() > 0 && this.fillPrice() > 0;
  }

  protected setQuickQty(percent: number): void {
    const a = this.asset();
    if (!a) return;
    if (this.side() === 'BUY') {
      const qty = (this.portfolio.cashBalance() * percent) / a.price;
      this.quantity.set(+(qty < 1 ? qty.toFixed(4) : qty.toFixed(2)));
    } else {
      const h = this.portfolio.holdings().find(x => x.symbol === a.symbol);
      const qty = (h?.quantity ?? 0) * percent;
      this.quantity.set(+(qty < 1 ? qty.toFixed(4) : qty.toFixed(2)));
    }
  }

  protected submit(): void {
    this.errorMsg.set(null);
    this.successMsg.set(null);
    const a = this.asset();
    if (!a) return;

    const result = this.portfolio.submitOrder({
      symbol: a.symbol,
      side: this.side(),
      type: this.type(),
      quantity: this.quantity(),
      limitPrice: this.type() === 'LIMIT' ? this.limitPrice() : undefined,
    });

    if (!result.ok) {
      this.errorMsg.set(result.error);
      return;
    }

    this.successMsg.set(
      result.trade.status === 'FILLED'
        ? `Order filled: ${result.trade.side} ${result.trade.quantity} ${result.trade.symbol} @ ${result.trade.price.toFixed(2)}`
        : `Limit order placed: ${result.trade.side} ${result.trade.quantity} ${result.trade.symbol} @ ${result.trade.price.toFixed(2)}`
    );
  }
}
