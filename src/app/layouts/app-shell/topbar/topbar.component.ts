import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { PortfolioService } from '../../../core/services/portfolio.service';
import { MarketDataService } from '../../../core/services/market-data.service';
import { NotificationsService } from '../../../core/services/notifications.service';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { PriceChangeComponent } from '../../../shared/components/price-change/price-change.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [FormsModule, IconComponent, CurrencyFormatPipe, PriceChangeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topbar">
      <div class="search">
        <app-icon name="search" [size]="16"/>
        <input
          class="search-input"
          type="search"
          placeholder="Search symbol e.g. AAPL, BTC-USD…"
          [ngModel]="searchTerm()"
          (ngModelChange)="onSearchInput($event)"
          (keydown.enter)="submitSearch()"
          aria-label="Search markets"
        />
        @if (searchResults().length > 0 && searchOpen()) {
          <ul class="search-results" role="listbox">
            @for (asset of searchResults(); track asset.symbol) {
              <li>
                <button class="result" (click)="selectResult(asset.symbol)" role="option">
                  <span class="result-symbol">{{ asset.symbol }}</span>
                  <span class="result-name">{{ asset.name }}</span>
                  <span class="result-price">{{ asset.price | currencyFmt }}</span>
                </button>
              </li>
            }
          </ul>
        }
      </div>

      <div class="topbar-end">
        <div class="portfolio-pill" aria-label="Portfolio value">
          <span class="pill-label">Portfolio</span>
          <span class="pill-value">{{ summary().totalValue | currencyFmt }}</span>
          <app-price-change [value]="summary().dailyPnLPercent" mode="percent"/>
        </div>

        <button
          class="icon-btn"
          aria-label="Notifications"
          title="Notifications"
          (click)="goToNotifications()"
        >
          <app-icon name="bell" [size]="18"/>
          @if (unreadCount() > 0) {
            <span class="notif-badge" aria-hidden="true">
              {{ unreadCount() > 9 ? '9+' : unreadCount() }}
            </span>
          }
        </button>
      </div>
    </header>
  `,
  styleUrl: './topbar.component.css',
})
export class TopbarComponent {
  private readonly portfolio = inject(PortfolioService);
  private readonly market = inject(MarketDataService);
  private readonly notifs = inject(NotificationsService);
  private readonly router = inject(Router);

  protected readonly summary = this.portfolio.summary;
  protected readonly unreadCount = this.notifs.unreadCount;
  protected readonly searchTerm = signal('');
  protected readonly searchOpen = signal(false);

  protected readonly searchResults = computed(() => {
    const term = this.searchTerm().trim().toUpperCase();
    if (!term) return [];
    return this.market.assets()
      .filter(a => a.symbol.includes(term) || a.name.toUpperCase().includes(term))
      .slice(0, 6);
  });

  protected goToNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  protected onSearchInput(v: string): void {
    this.searchTerm.set(v);
    this.searchOpen.set(true);
  }

  protected submitSearch(): void {
    const first = this.searchResults()[0];
    if (first) this.selectResult(first.symbol);
  }

  protected selectResult(symbol: string): void {
    this.searchTerm.set('');
    this.searchOpen.set(false);
    this.router.navigate(['/trade', symbol]);
  }
}
