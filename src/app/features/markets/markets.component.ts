import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MarketDataService } from '../../core/services/market-data.service';
import { SparklineComponent } from '../../shared/components/sparkline/sparkline.component';
import { PriceChangeComponent } from '../../shared/components/price-change/price-change.component';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { CompactNumberPipe } from '../../shared/pipes/compact-number.pipe';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { AssetCategory } from '../../core/models/asset.model';

type Filter = 'all' | AssetCategory;

const PAGE_SIZE = 25;

const SECTORS = [
  'all',
  'Technology',
  'Communications',
  'Consumer',
  'Finance',
  'Healthcare',
  'Energy',
  'Industrials',
] as const;

@Component({
  selector: 'app-markets',
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
      <header class="page-head">
        <div>
          <span class="eyebrow">Markets</span>
          <h1 class="page-title">Live Market Data</h1>
          <p class="page-sub">{{ filtered().length }} assets across stocks, crypto &amp; ETFs</p>
        </div>
        <div class="page-actions">
          <div class="search-box">
            <app-icon name="search" [size]="14"/>
            <input
              class="search-input"
              type="search"
              placeholder="Filter by symbol or name…"
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
            />
          </div>
        </div>
      </header>

      <!-- Primary filter tabs -->
      <div class="filter-row">
        <div class="filter-tabs" role="tablist">
          @for (f of filterOptions; track f.id) {
            <button
              class="filter-tab"
              role="tab"
              [class.is-active]="filter() === f.id"
              [attr.aria-selected]="filter() === f.id"
              (click)="setFilter(f.id)"
            >
              {{ f.label }}
              <span class="filter-count">{{ countFor(f.id) }}</span>
            </button>
          }
        </div>

        <div class="sort-control">
          <label class="text-xs text-muted uppercase">Sort by</label>
          <select class="sort-select" [ngModel]="sortBy()" (ngModelChange)="sortBy.set($event)">
            <option value="symbol">Symbol</option>
            <option value="price">Price</option>
            <option value="changePercent">Change %</option>
            <option value="volume">Volume</option>
            <option value="marketCap">Market Cap</option>
          </select>
        </div>
      </div>

      <!-- Sector chips — visible only in Stocks tab -->
      @if (filter() === 'stock') {
        <div class="sector-row" role="group" aria-label="Filter by sector">
          @for (s of sectors; track s) {
            <button
              class="sector-chip"
              [class.is-active]="sector() === s"
              (click)="setSector(s)"
            >{{ s === 'all' ? 'All Sectors' : s }}</button>
          }
        </div>
      }

      <!-- Asset table -->
      <article class="card no-pad">
        <div class="table-wrap">
          <table class="table markets-table">
            <thead>
              <tr>
                <th class="col-sym">Symbol</th>
                <th>Name</th>
                <th class="num">Price</th>
                <th class="num">Change</th>
                <th class="num">Change %</th>
                <th class="num hide-sm">Volume</th>
                <th class="num col-mcap hide-md">Mkt Cap</th>
                <th class="col-spark hide-sm">Trend</th>
                <th class="col-action"></th>
              </tr>
            </thead>
            <tbody>
              @for (a of paged(); track a.symbol) {
                <tr>
                  <td>
                    <div class="sym-cell">
                      <span class="sym-icon" [class.is-crypto]="a.category === 'crypto'" [class.is-etf]="a.category === 'etf'">
                        {{ a.symbol.slice(0, 2) }}
                      </span>
                      <div class="sym-meta">
                        <span class="symbol-tag">{{ a.symbol }}</span>
                        @if (a.sector) {
                          <span class="sector-badge">{{ a.sector }}</span>
                        }
                      </div>
                    </div>
                  </td>
                  <td class="text-secondary truncate asset-name">{{ a.name }}</td>
                  <td class="num font-mono">{{ a.price | currencyFmt }}</td>
                  <td class="num">
                    <app-price-change [value]="a.change" mode="currency"/>
                  </td>
                  <td class="num">
                    <app-price-change [value]="a.changePercent" mode="percent"/>
                  </td>
                  <td class="num text-secondary hide-sm">{{ a.volume | compactNumber }}</td>
                  <td class="num hide-md">
                    @if (a.marketCap) {
                      <span class="text-secondary">{{ a.marketCap | currencyFmt:{ compact: true } }}</span>
                    } @else {
                      <span class="text-muted">—</span>
                    }
                  </td>
                  <td class="col-spark hide-sm">
                    <app-sparkline [data]="a.sparklineData" [width]="80" [height]="28"/>
                  </td>
                  <td class="col-action">
                    <a [routerLink]="['/trade', a.symbol]" class="btn btn-secondary btn-sm">
                      Trade
                    </a>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9">
                    <div class="empty-row">No assets match your filters.</div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination footer -->
        @if (totalPages() > 1) {
          <div class="pagination">
            <button
              class="btn btn-secondary btn-sm"
              [disabled]="page() === 0"
              (click)="page.set(page() - 1)"
            >
              <app-icon name="chevron-left" [size]="13"/> Prev
            </button>
            <span class="page-info">
              <span class="page-num">{{ page() + 1 }}</span>
              <span class="text-muted"> of {{ totalPages() }}</span>
            </span>
            <button
              class="btn btn-secondary btn-sm"
              [disabled]="page() === totalPages() - 1"
              (click)="page.set(page() + 1)"
            >
              Next <app-icon name="chevron-right" [size]="13"/>
            </button>
          </div>
        }
      </article>
    </div>
  `,
  styleUrl: './markets.component.css',
})
export class MarketsComponent {
  private readonly market = inject(MarketDataService);

  protected readonly assets = this.market.assets;
  protected readonly sectors = SECTORS;

  protected readonly filterOptions: { id: Filter; label: string }[] = [
    { id: 'all',    label: 'All' },
    { id: 'stock',  label: 'Stocks' },
    { id: 'crypto', label: 'Crypto' },
    { id: 'etf',    label: 'ETFs' },
  ];

  protected readonly searchTerm = signal('');
  protected readonly filter     = signal<Filter>('all');
  protected readonly sector     = signal<string>('all');
  protected readonly sortBy     = signal<'symbol' | 'price' | 'changePercent' | 'volume' | 'marketCap'>('changePercent');
  protected readonly page       = signal(0);

  constructor() {
    // Reset to page 0 whenever any filter or sort changes
    effect(() => {
      this.filter();
      this.sector();
      this.searchTerm();
      this.sortBy();
      untracked(() => this.page.set(0));
    });
  }

  protected readonly filtered = computed(() => {
    const term = this.searchTerm().trim().toUpperCase();
    const f    = this.filter();
    const sec  = this.sector();

    let list = this.assets().filter(a => {
      if (f !== 'all' && a.category !== f) return false;
      if (f === 'stock' && sec !== 'all' && a.sector !== sec) return false;
      if (!term) return true;
      return a.symbol.includes(term) || a.name.toUpperCase().includes(term);
    });

    const sort = this.sortBy();
    list = [...list].sort((a, b) => {
      if (sort === 'symbol') return a.symbol.localeCompare(b.symbol);
      if (sort === 'marketCap') return (b.marketCap ?? 0) - (a.marketCap ?? 0);
      return (b as any)[sort] - (a as any)[sort];
    });

    return list;
  });

  protected readonly paged = computed(() => {
    const p = this.page();
    return this.filtered().slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE);
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)),
  );

  countFor(filter: Filter): number {
    if (filter === 'all') return this.assets().length;
    return this.assets().filter(a => a.category === filter).length;
  }

  setFilter(f: Filter): void {
    this.filter.set(f);
    this.sector.set('all'); // reset sector when changing category
  }

  setSector(s: string): void {
    this.sector.set(s);
  }
}
