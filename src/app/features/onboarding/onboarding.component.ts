import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon.component';

interface Step {
  title: string;
  subtitle: string;
  body: string;
  icon: string;
  accent: string;
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="onboarding-card">
        <!-- Progress dots -->
        <div class="progress-dots" role="tablist" aria-label="Onboarding steps">
          @for (s of steps; track $index) {
            <button
              class="dot"
              [class.is-active]="$index === step()"
              [class.is-done]="$index < step()"
              role="tab"
              [attr.aria-selected]="$index === step()"
              [attr.aria-label]="'Step ' + ($index + 1)"
              (click)="step.set($index)"
            ></button>
          }
        </div>

        <!-- Step content -->
        <div class="step-body">
          <div class="step-icon-wrap" [style.background]="current().accent + '22'">
            <app-icon [name]="$any(current().icon)" [size]="32"/>
          </div>
          <h2 class="step-title">{{ current().title }}</h2>
          <p class="step-subtitle">{{ current().subtitle }}</p>
          <p class="step-body-text">{{ current().body }}</p>
        </div>

        <!-- Navigation -->
        <div class="step-nav">
          <button
            class="btn btn-secondary"
            [disabled]="step() === 0"
            (click)="prev()"
          >Back</button>

          @if (step() < steps.length - 1) {
            <button class="btn btn-primary" (click)="next()">Continue</button>
          } @else {
            <button class="btn btn-primary" (click)="finish()">Start trading</button>
          }
        </div>

        @if (step() < steps.length - 1) {
          <button class="skip-link" (click)="finish()">Skip for now</button>
        }
      </div>
    </div>
  `,
  styleUrl: './onboarding.component.css',
})
export class OnboardingComponent {
  private readonly router = inject(Router);

  protected readonly step = signal(0);

  protected readonly steps: Step[] = [
    {
      title: 'Welcome to PaperTrade Pro',
      subtitle: 'Risk-free trading, real market data.',
      body: 'Practise trading stocks, ETFs, and crypto with $100,000 in virtual funds. Build confidence before risking real money.',
      icon: 'logo',
      accent: '#6366f1',
    },
    {
      title: 'Explore the Markets',
      subtitle: 'Real-time prices, trends, and movers.',
      body: 'Browse hundreds of assets on the Markets page. Use the search to find any stock or crypto, then jump straight to the trade form.',
      icon: 'markets',
      accent: '#10b981',
    },
    {
      title: 'Execute Your First Trade',
      subtitle: 'Market and limit orders in seconds.',
      body: 'Place market orders for instant execution or set limit orders to buy/sell at a target price. Your portfolio updates in real time.',
      icon: 'trade',
      accent: '#f59e0b',
    },
    {
      title: 'Track Your Performance',
      subtitle: 'P&L, win rate, and trade history.',
      body: 'The Analytics page breaks down your win rate, volume, and per-symbol activity. Use it to identify patterns and refine your strategy.',
      icon: 'analytics',
      accent: '#6366f1',
    },
    {
      title: 'Learn as You Trade',
      subtitle: 'Courses, glossary, and competitions.',
      body: 'Sharpen your skills in the Academy, compete on the leaderboard, and set price alerts so you never miss a move.',
      icon: 'academy',
      accent: '#10b981',
    },
  ];

  protected readonly current = computed(() => this.steps[this.step()]);

  protected next(): void {
    if (this.step() < this.steps.length - 1) this.step.update(s => s + 1);
  }

  protected prev(): void {
    if (this.step() > 0) this.step.update(s => s - 1);
  }

  protected finish(): void {
    this.router.navigate(['/dashboard']);
  }
}
