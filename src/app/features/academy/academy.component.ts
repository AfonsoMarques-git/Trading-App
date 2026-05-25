import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon.component';

interface Lesson { id: string; title: string; duration: string; }
interface Module { id: string; title: string; level: 'Beginner' | 'Intermediate' | 'Advanced'; lessons: Lesson[]; color: string; }

@Component({
  selector: 'app-academy',
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <span class="eyebrow">Academy</span>
          <h1 class="page-title">Learn to trade</h1>
          <p class="page-sub">Structured lessons from the basics to advanced strategies.</p>
        </div>
        <a routerLink="/academy/glossary" class="btn btn-secondary">
          <app-icon name="academy" [size]="14"/>
          Trading glossary
        </a>
      </header>

      <div class="module-grid">
        @for (mod of modules; track mod.id) {
          <article class="module-card">
            <div class="module-header" [style.borderColor]="mod.color">
              <div class="module-level-badge" [style.background]="mod.color + '22'" [style.color]="mod.color">
                {{ mod.level }}
              </div>
              <h2 class="module-title">{{ mod.title }}</h2>
              <p class="module-count">{{ mod.lessons.length }} lessons</p>
            </div>
            <ul class="lesson-list">
              @for (lesson of mod.lessons; track lesson.id) {
                <li>
                  <a [routerLink]="['/academy/lesson', lesson.id]" class="lesson-row">
                    <span class="lesson-icon">
                      <app-icon name="academy" [size]="12"/>
                    </span>
                    <span class="lesson-title">{{ lesson.title }}</span>
                    <span class="lesson-duration">{{ lesson.duration }}</span>
                  </a>
                </li>
              }
            </ul>
          </article>
        }
      </div>
    </div>
  `,
  styleUrl: './academy.component.css',
})
export class AcademyComponent {
  protected readonly modules: Module[] = [
    {
      id: 'basics', title: 'Trading Basics', level: 'Beginner', color: '#10b981',
      lessons: [
        { id: 'what-is-trading',     title: 'What is stock trading?',          duration: '5 min' },
        { id: 'market-hours',        title: 'Market hours and sessions',        duration: '4 min' },
        { id: 'order-types',         title: 'Market vs limit orders',           duration: '6 min' },
        { id: 'bid-ask',             title: 'Bid, ask, and the spread',         duration: '5 min' },
        { id: 'reading-quotes',      title: 'How to read a stock quote',        duration: '4 min' },
      ],
    },
    {
      id: 'analysis', title: 'Technical Analysis', level: 'Intermediate', color: '#6366f1',
      lessons: [
        { id: 'candlesticks',        title: 'Candlestick charts explained',     duration: '8 min' },
        { id: 'support-resistance',  title: 'Support and resistance levels',    duration: '7 min' },
        { id: 'moving-averages',     title: 'Moving averages (SMA & EMA)',      duration: '9 min' },
        { id: 'rsi',                 title: 'RSI — momentum indicator',         duration: '6 min' },
        { id: 'macd',                title: 'MACD and signal lines',            duration: '8 min' },
      ],
    },
    {
      id: 'strategy', title: 'Trading Strategies', level: 'Intermediate', color: '#f59e0b',
      lessons: [
        { id: 'trend-following',     title: 'Trend following strategies',       duration: '10 min' },
        { id: 'mean-reversion',      title: 'Mean reversion explained',         duration: '8 min' },
        { id: 'breakout',            title: 'Breakout trading',                 duration: '9 min' },
        { id: 'position-sizing',     title: 'Position sizing and risk per trade', duration: '7 min' },
      ],
    },
    {
      id: 'risk', title: 'Risk Management', level: 'Advanced', color: '#ef4444',
      lessons: [
        { id: 'stop-loss',           title: 'Stop-loss and take-profit orders', duration: '7 min' },
        { id: 'risk-reward',         title: 'Risk/reward ratio',                duration: '6 min' },
        { id: 'diversification',     title: 'Portfolio diversification',        duration: '8 min' },
        { id: 'drawdown',            title: 'Managing drawdowns',               duration: '9 min' },
      ],
    },
  ];
}
