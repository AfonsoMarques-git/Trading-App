import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-shell">
      <div class="auth-side" aria-hidden="true">
        <div class="auth-brand">
          <span class="auth-logo">
            <svg viewBox="0 0 32 32" width="32" height="32">
              <defs>
                <linearGradient id="auth-g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stop-color="#6366f1"/>
                  <stop offset="1" stop-color="#10b981"/>
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="8" fill="url(#auth-g)"/>
              <path d="M6 22 L12 14 L18 18 L26 8" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="auth-brand-text">PaperTrade <span class="brand-suffix">Pro</span></span>
        </div>

        <div class="auth-hero">
          <h1 class="auth-headline">Master the markets, risk-free.</h1>
          <p class="auth-sub">Trade real-time data with $100,000 of virtual capital. Compete, learn, and sharpen your strategy in a premium simulator built for serious traders.</p>

          <ul class="auth-features">
            <li><span class="dot" style="background: var(--color-accent-green)"></span> Real market data, instant fills</li>
            <li><span class="dot" style="background: var(--color-accent)"></span> Portfolio analytics & deep insights</li>
            <li><span class="dot" style="background: var(--color-accent-yellow)"></span> Compete on weekly leaderboards</li>
          </ul>
        </div>

        <div class="auth-stats">
          <div class="stat">
            <span class="stat-num">$100k</span>
            <span class="stat-label">Virtual capital</span>
          </div>
          <div class="stat">
            <span class="stat-num">10+</span>
            <span class="stat-label">Live assets</span>
          </div>
          <div class="stat">
            <span class="stat-num">0%</span>
            <span class="stat-label">Risk to you</span>
          </div>
        </div>
      </div>

      <div class="auth-main">
        <router-outlet/>
      </div>
    </div>
  `,
  styles: [`
    .auth-shell {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 100vh;
      background-color: var(--color-bg-primary);
    }
    .auth-side {
      position: relative;
      padding: var(--space-12);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background:
        radial-gradient(80% 60% at 0% 0%, rgba(99, 102, 241, 0.15), transparent 60%),
        radial-gradient(80% 60% at 100% 100%, rgba(16, 185, 129, 0.1), transparent 60%),
        var(--color-bg-secondary);
      border-right: 1px solid var(--color-border);
      overflow: hidden;
    }
    .auth-side::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(99, 102, 241, 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(99, 102, 241, 0.04) 1px, transparent 1px);
      background-size: 32px 32px;
      mask-image: radial-gradient(circle at center, black 0%, transparent 70%);
      pointer-events: none;
    }
    .auth-brand {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      position: relative;
    }
    .auth-brand-text {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      letter-spacing: -0.01em;
    }
    .brand-suffix { color: var(--color-accent); font-weight: var(--font-weight-bold); }
    .auth-hero {
      position: relative;
      max-width: 480px;
    }
    .auth-headline {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      line-height: 1.15;
      letter-spacing: -0.02em;
      margin-bottom: var(--space-4);
      background: linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .auth-sub {
      font-size: var(--font-size-md);
      line-height: var(--line-height-relaxed);
      color: var(--color-text-secondary);
      margin-bottom: var(--space-6);
    }
    .auth-features {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
    .auth-features li {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .auth-stats {
      position: relative;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-6);
      padding-top: var(--space-6);
      border-top: 1px solid var(--color-border);
    }
    .stat {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }
    .stat-num {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      letter-spacing: -0.02em;
    }
    .stat-label {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .auth-main {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-12) var(--space-6);
    }
    @media (max-width: 960px) {
      .auth-shell { grid-template-columns: 1fr; }
      .auth-side { display: none; }
    }
  `],
})
export class AuthLayoutComponent {}
