import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PortfolioService } from '../../core/services/portfolio.service';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { OrderStatus } from '../../core/models/portfolio.model';

type StatusFilter = 'all' | OrderStatus;

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [RouterLink, CurrencyFormatPipe, IconComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <span class="eyebrow">Orders</span>
          <h1 class="page-title">Trade History</h1>
          <p class="page-sub">{{ filtered().length }} orders</p>
        </div>
        <div class="page-actions">
          <a routerLink="/markets" class="btn btn-primary">
            <app-icon name="plus" [size]="14"/>
            New trade
          </a>
        </div>
      </header>

      <div class="filter-row">
        <div class="filter-tabs" role="tablist">
          @for (s of statuses; track s.id) {
            <button
              class="filter-tab"
              role="tab"
              [class.is-active]="filter() === s.id"
              [attr.aria-selected]="filter() === s.id"
              (click)="filter.set(s.id)"
            >
              {{ s.label }}
              <span class="filter-count">{{ countFor(s.id) }}</span>
            </button>
          }
        </div>
      </div>

      <article class="card no-pad">
        @if (filtered().length === 0) {
          <app-empty-state title="No orders found" description="Try changing the status filter, or place a new trade.">
            <a routerLink="/markets" class="btn btn-primary" style="margin-top: var(--space-3)">Browse markets</a>
          </app-empty-state>
        } @else {
          <div class="table-wrap">
            <table class="table orders-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Order ID</th>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th>Type</th>
                  <th class="num">Quantity</th>
                  <th class="num">Price</th>
                  <th class="num">Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (t of filtered(); track t.id) {
                  <tr>
                    <td>
                      <div class="date-cell">
                        <span class="date-main">{{ formatDate(t.timestamp) }}</span>
                        <span class="date-sub">{{ formatTime(t.timestamp) }}</span>
                      </div>
                    </td>
                    <td class="font-mono text-secondary">{{ t.id }}</td>
                    <td><span class="symbol-tag">{{ t.symbol }}</span></td>
                    <td>
                      <span class="badge" [class.badge-green]="t.side === 'BUY'" [class.badge-red]="t.side === 'SELL'">
                        {{ t.side }}
                      </span>
                    </td>
                    <td class="text-secondary">{{ t.type }}</td>
                    <td class="num font-mono">{{ formatQty(t.quantity) }}</td>
                    <td class="num font-mono">{{ t.price | currencyFmt }}</td>
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
        }
      </article>
    </div>
  `,
  styleUrl: './orders.component.css',
})
export class OrdersComponent {
  private readonly portfolio = inject(PortfolioService);

  protected readonly trades = this.portfolio.trades;

  protected readonly filter = signal<StatusFilter>('all');

  protected readonly statuses: { id: StatusFilter; label: string }[] = [
    { id: 'all',       label: 'All' },
    { id: 'FILLED',    label: 'Filled' },
    { id: 'PENDING',   label: 'Pending' },
    { id: 'CANCELLED', label: 'Cancelled' },
    { id: 'REJECTED',  label: 'Rejected' },
  ];

  protected readonly filtered = computed(() => {
    const f = this.filter();
    return f === 'all' ? this.trades() : this.trades().filter(t => t.status === f);
  });

  countFor(filter: StatusFilter): number {
    if (filter === 'all') return this.trades().length;
    return this.trades().filter(t => t.status === filter).length;
  }

  protected formatDate(d: Date): string {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
  }

  protected formatTime(d: Date): string {
    return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  }

  protected formatQty(q: number): string {
    if (q < 1) return q.toFixed(4);
    if (q < 100) return q.toFixed(2);
    return q.toFixed(0);
  }
}
