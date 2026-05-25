import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="nf">
      <span class="code">404</span>
      <h1 class="title">Page not found</h1>
      <p class="sub">The page you're looking for doesn't exist or has been moved.</p>
      <div class="actions">
        <a routerLink="/dashboard" class="btn btn-primary">Go to Dashboard</a>
        <a routerLink="/markets" class="btn btn-secondary">Browse Markets</a>
      </div>
    </div>
  `,
  styles: [`
    .nf {
      min-height: 60vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-3);
      text-align: center;
      padding: var(--space-12);
    }
    .code {
      font-family: var(--font-mono);
      font-size: var(--font-size-4xl);
      font-weight: var(--font-weight-bold);
      background: linear-gradient(135deg, var(--color-accent), var(--color-accent-green));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      letter-spacing: -0.04em;
    }
    .title {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
    }
    .sub {
      color: var(--color-text-secondary);
      max-width: 380px;
      margin-bottom: var(--space-3);
    }
    .actions {
      display: flex;
      gap: var(--space-3);
      flex-wrap: wrap;
      justify-content: center;
    }
  `],
})
export class NotFoundComponent {}
