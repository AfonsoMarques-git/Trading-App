import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { PortfolioService } from '../../core/services/portfolio.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

interface Achievement {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  category: 'trading' | 'portfolio' | 'learning' | 'streak';
  unlocked: boolean;
  progress?: number;
  total?: number;
}

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [IconComponent, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <span class="eyebrow">Achievements</span>
          <h1 class="page-title">Your badges</h1>
          <p class="page-sub">{{ unlockedCount() }} of {{ achievements().length }} unlocked</p>
        </div>
      </header>

      <!-- Progress bar -->
      <div class="overall-progress">
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="progressPct()"></div>
        </div>
        <span class="progress-label">{{ progressPct() | number:'1.0-0' }}% complete</span>
      </div>

      <!-- Category sections -->
      @for (cat of categories; track cat.id) {
        <section class="cat-section">
          <h2 class="cat-title">{{ cat.label }}</h2>
          <div class="badge-grid">
            @for (a of byCategory(cat.id); track a.id) {
              <div class="badge-card" [class.is-locked]="!a.unlocked">
                <div class="badge-emoji" [class.grayscale]="!a.unlocked">{{ a.emoji }}</div>
                <div class="badge-info">
                  <span class="badge-title">{{ a.title }}</span>
                  <span class="badge-desc">{{ a.desc }}</span>
                  @if (a.progress !== undefined && a.total !== undefined && !a.unlocked) {
                    <div class="badge-progress">
                      <div class="badge-progress-bar">
                        <div class="badge-progress-fill" [style.width.%]="(a.progress / a.total) * 100"></div>
                      </div>
                      <span class="badge-progress-label">{{ a.progress }} / {{ a.total }}</span>
                    </div>
                  }
                </div>
                @if (a.unlocked) {
                  <span class="badge-check">
                    <app-icon name="check" [size]="12"/>
                  </span>
                }
              </div>
            }
          </div>
        </section>
      }
    </div>
  `,
  styleUrl: './achievements.component.css',
})
export class AchievementsComponent {
  private readonly portfolio = inject(PortfolioService);

  private get tradeCount(): number { return this.portfolio.trades().filter(t => t.status === 'FILLED').length; }
  private get holdingsCount(): number { return this.portfolio.holdings().length; }
  private get totalValue(): number { return this.portfolio.summary().totalValue; }
  private get winRate(): number { return this.portfolio.summary().winRate; }

  protected readonly categories = [
    { id: 'trading',   label: 'Trading' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'learning',  label: 'Learning' },
    { id: 'streak',    label: 'Streaks' },
  ];

  protected readonly achievements = computed<Achievement[]>(() => {
    const trades = this.tradeCount;
    const holdings = this.holdingsCount;
    const value = this.totalValue;
    const wr = this.winRate;

    return [
      // Trading
      { id: 'first-trade',   title: 'First trade',      desc: 'Execute your first order.',                   emoji: '🎯', category: 'trading',   unlocked: trades >= 1 },
      { id: 'five-trades',   title: 'Getting warmed up', desc: 'Execute 5 trades.',                          emoji: '🔥', category: 'trading',   unlocked: trades >= 5,  progress: Math.min(trades, 5), total: 5 },
      { id: 'ten-trades',    title: 'Active trader',    desc: 'Execute 10 trades.',                          emoji: '📈', category: 'trading',   unlocked: trades >= 10, progress: Math.min(trades, 10), total: 10 },
      { id: 'buy-sell',      title: 'Two-way street',   desc: 'Place both a BUY and a SELL order.',          emoji: '↔️', category: 'trading',   unlocked: this.portfolio.trades().some(t => t.side === 'BUY') && this.portfolio.trades().some(t => t.side === 'SELL') },
      { id: 'big-trade',     title: 'High roller',      desc: 'Place a single order worth over $10,000.',    emoji: '💰', category: 'trading',   unlocked: this.portfolio.trades().some(t => t.total >= 10_000) },
      // Portfolio
      { id: 'diversified',   title: 'Diversified',      desc: 'Hold 3 or more different assets.',            emoji: '🗂️', category: 'portfolio', unlocked: holdings >= 3, progress: Math.min(holdings, 3), total: 3 },
      { id: 'crypto-holder', title: 'Crypto curious',   desc: 'Hold a cryptocurrency position.',             emoji: '₿',  category: 'portfolio', unlocked: this.portfolio.holdings().some(h => h.symbol.includes('-')) },
      { id: 'profit-10k',    title: 'Five-figure fund',  desc: 'Grow your portfolio to $110,000.',           emoji: '🏆', category: 'portfolio', unlocked: value >= 110_000 },
      { id: 'win-rate-60',   title: 'Sharp shooter',    desc: 'Achieve a win rate above 60%.',               emoji: '🎯', category: 'portfolio', unlocked: wr >= 60 },
      // Learning
      { id: 'first-lesson',  title: 'Student',          desc: 'Complete your first Academy lesson.',         emoji: '📚', category: 'learning',  unlocked: false },
      { id: 'all-basics',    title: 'Foundations',      desc: 'Complete all beginner modules.',              emoji: '🎓', category: 'learning',  unlocked: false },
      { id: 'glossary',      title: 'Dictionary',       desc: 'Look up 10 terms in the glossary.',          emoji: '📖', category: 'learning',  unlocked: false, progress: 0, total: 10 },
      // Streaks
      { id: 'login-7',       title: 'Weekly habit',     desc: 'Log in 7 days in a row.',                    emoji: '📅', category: 'streak',    unlocked: false, progress: 1, total: 7 },
      { id: 'trade-3-days',  title: 'Consistent',       desc: 'Trade on 3 consecutive days.',               emoji: '⚡', category: 'streak',    unlocked: false, progress: 1, total: 3 },
    ];
  });

  protected readonly unlockedCount = computed(() => this.achievements().filter(a => a.unlocked).length);
  protected readonly progressPct = computed(() => (this.unlockedCount() / this.achievements().length) * 100);

  protected byCategory(cat: string): Achievement[] {
    return this.achievements().filter(a => a.category === cat);
  }
}
