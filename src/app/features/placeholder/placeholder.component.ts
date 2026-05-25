import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { IconComponent, IconName } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page placeholder">
      <header class="page-head">
        <div>
          <span class="eyebrow">{{ pageTitle() }}</span>
          <h1 class="page-title">{{ pageTitle() }}</h1>
          <p class="page-sub">{{ description() }}</p>
        </div>
      </header>

      <article class="card placeholder-card">
        <div class="placeholder-icon" aria-hidden="true">
          <app-icon [name]="iconName()" [size]="40"/>
        </div>
        <h2 class="placeholder-heading">Coming soon</h2>
        <p class="placeholder-body">
          This feature is part of Phase 3C and will ship alongside the next release of PaperTrade Pro.
          Continue exploring the app — your trading data is fully active in Dashboard, Markets, Portfolio, Trade, and Orders.
        </p>
        <div class="placeholder-actions">
          <a routerLink="/dashboard" class="btn btn-primary">Back to Dashboard</a>
          <a routerLink="/markets" class="btn btn-secondary">Explore Markets</a>
        </div>
      </article>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { display: flex; flex-direction: column; gap: var(--space-5); }
    .page-head { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: var(--space-4); }
    .eyebrow {
      display: inline-block;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-accent);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: var(--space-1);
    }
    .page-title {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      letter-spacing: -0.02em;
      margin-bottom: var(--space-1);
    }
    .page-sub { color: var(--color-text-secondary); font-size: var(--font-size-sm); }

    .placeholder-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-16) var(--space-6);
      text-align: center;
      gap: var(--space-3);
      background:
        radial-gradient(60% 50% at 50% 0%, rgba(99, 102, 241, 0.08), transparent 70%),
        var(--color-bg-card);
    }
    .placeholder-icon {
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-xl);
      background-color: var(--color-bg-elevated);
      color: var(--color-accent);
      margin-bottom: var(--space-3);
    }
    .placeholder-heading {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      letter-spacing: -0.01em;
    }
    .placeholder-body {
      max-width: 480px;
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
      line-height: var(--line-height-relaxed);
      margin-bottom: var(--space-3);
    }
    .placeholder-actions {
      display: flex;
      gap: var(--space-3);
      flex-wrap: wrap;
      justify-content: center;
    }
  `],
})
export class PlaceholderComponent {
  readonly title = input<string>('');
  readonly description = input<string>('');
  readonly icon = input<IconName>('logo');

  private readonly route = inject(ActivatedRoute);
  private readonly routeData = toSignal(this.route.data.pipe(map(d => d)), { initialValue: {} as any });

  protected readonly pageTitle = computed<string>(() => {
    return this.title() || this.routeData()['title'] || 'PaperTrade Pro';
  });

  protected readonly iconName = computed<IconName>(() => {
    return (this.routeData()['icon'] as IconName) || this.icon();
  });
}
