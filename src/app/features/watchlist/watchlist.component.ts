import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WatchlistService } from '../../core/services/watchlist.service';
import { MarketDataService } from '../../core/services/market-data.service';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { PriceChangeComponent } from '../../shared/components/price-change/price-change.component';
import { SparklineComponent } from '../../shared/components/sparkline/sparkline.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [RouterLink, CurrencyFormatPipe, PriceChangeComponent, SparklineComponent, IconComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <span class="eyebrow">Watchlist</span>
          <h1 class="page-title">Watched assets</h1>
          <p class="page-sub">{{ watchlist.symbols().length }} symbols</p>
        </div>
      </header>

      <!-- Add symbol -->
      <div class="add-row">
        <div class="search-wrap">
          <app-icon name="search" [size]="14"/>
          <input
            type="text"
            class="search-input"
            placeholder="Add symbol (e.g. AAPL)"
            [value]="query()"
            (input)="query.set($any($event.target).value)"
            (keydown.enter)="addSymbol()"
            autocomplete="off"
            spellcheck="false"
          />
        </div>
        <button class="btn btn-primary" (click)="addSymbol()" [disabled]="!query().trim()">
          <app-icon name="plus" [size]="14"/>
          Add
        </button>
      </div>

      @if (addError()) {
        <p class="add-error">{{ addError() }}</p>
      }

      <!-- Asset list -->
      @if (watchlistAssets().length === 0) {
        <app-empty-state
          title="Your watchlist is empty"
          description="Add symbols above to start tracking assets."
        >
          <a routerLink="/markets" class="btn btn-primary" style="margin-top: var(--space-3)">Browse markets</a>
        </app-empty-state>
      } @else {
        <div class="asset-list">
          @for (row of watchlistAssets(); track row.symbol) {
            <div class="asset-row">
              <a [routerLink]="['/trade', row.symbol]" class="asset-meta">
                <span class="symbol-tag">{{ row.symbol }}</span>
                <span class="asset-name truncate">{{ row.name }}</span>
              </a>
              <div class="asset-spark">
                <app-sparkline [data]="row.sparklineData" [width]="80" [height]="32" [trend]="row.changePercent >= 0 ? 'up' : 'down'"/>
              </div>
              <div class="asset-price">
                <span class="price-value">{{ row.price | currencyFmt }}</span>
                <app-price-change [value]="row.changePercent" mode="percent"/>
              </div>
              <div class="asset-actions">
                <a [routerLink]="['/trade', row.symbol]" class="btn btn-secondary btn-sm">Trade</a>
                <button class="btn-icon" title="Remove" (click)="watchlist.remove(row.symbol)">
                  <app-icon name="close" [size]="14"/>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './watchlist.component.css',
})
export class WatchlistComponent {
  protected readonly watchlist = inject(WatchlistService);
  private readonly market = inject(MarketDataService);

  protected readonly query = signal('');
  protected readonly addError = signal('');

  protected readonly watchlistAssets = computed(() =>
    this.watchlist.symbols()
      .map(sym => this.market.getBySymbol(sym))
      .filter((a): a is NonNullable<typeof a> => a !== undefined),
  );

  protected addSymbol(): void {
    const sym = this.query().trim().toUpperCase();
    if (!sym) return;
    if (this.watchlist.has(sym)) {
      this.addError.set(`${sym} is already on your watchlist.`);
      return;
    }
    if (!this.market.getBySymbol(sym)) {
      this.addError.set(`Symbol "${sym}" not found. Try browsing the Markets page.`);
      return;
    }
    this.addError.set('');
    this.watchlist.add(sym);
    this.query.set('');
  }
}
