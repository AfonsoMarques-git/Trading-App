import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { PortfolioService } from '../../core/services/portfolio.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { PercentFormatPipe } from '../../shared/pipes/percent-format.pipe';

interface Participant {
  rank: number;
  name: string;
  initials: string;
  portfolioValue: number;
  returnPct: number;
  trades: number;
  isYou?: boolean;
}

const LEADERBOARDS: Record<string, Participant[]> = {
  'weekly-may': [
    { rank: 1, name: 'SilverFox',    initials: 'SF', portfolioValue: 118_240, returnPct: 18.24, trades: 32 },
    { rank: 2, name: 'QuantQueen',   initials: 'QQ', portfolioValue: 114_810, returnPct: 14.81, trades: 19 },
    { rank: 3, name: 'Demo Trader',  initials: 'DT', portfolioValue: 112_150, returnPct: 12.15, trades: 7,  isYou: true },
    { rank: 4, name: 'AlphaWolf',    initials: 'AW', portfolioValue: 109_340, returnPct:  9.34, trades: 41 },
    { rank: 5, name: 'BullRunner',   initials: 'BR', portfolioValue: 107_660, returnPct:  7.66, trades: 28 },
    { rank: 6, name: 'TechTitan',    initials: 'TT', portfolioValue: 105_220, returnPct:  5.22, trades: 15 },
    { rank: 7, name: 'DivDave',      initials: 'DD', portfolioValue: 103_870, returnPct:  3.87, trades: 9  },
    { rank: 8, name: 'MomoKing',     initials: 'MK', portfolioValue: 102_100, returnPct:  2.10, trades: 56 },
  ],
  default: [
    { rank: 1, name: 'SilverFox',    initials: 'SF', portfolioValue: 115_000, returnPct: 15.00, trades: 22 },
    { rank: 2, name: 'Demo Trader',  initials: 'DT', portfolioValue: 112_000, returnPct: 12.00, trades: 7, isYou: true },
    { rank: 3, name: 'QuantQueen',   initials: 'QQ', portfolioValue: 110_000, returnPct: 10.00, trades: 14 },
  ],
};

const COMPETITION_TITLES: Record<string, string> = {
  'weekly-may':     'Weekly Challenge — May',
  'crypto-sprint':  'Crypto Sprint',
  'steady-returns': 'Steady Returns Cup',
  'april-open':     'April Open Championship',
};

@Component({
  selector: 'app-competition-detail',
  standalone: true,
  imports: [RouterLink, IconComponent, CurrencyFormatPipe, PercentFormatPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <nav class="breadcrumb">
        <a routerLink="/competitions" class="breadcrumb-link">
          <app-icon name="chevron-left" [size]="12"/>
          Competitions
        </a>
      </nav>

      <header class="page-head">
        <div>
          <span class="eyebrow">Leaderboard</span>
          <h1 class="page-title">{{ title() }}</h1>
          <p class="page-sub">{{ leaderboard().length }} participants</p>
        </div>
      </header>

      <!-- Your rank callout -->
      @if (yourEntry(); as you) {
        <div class="your-rank-card">
          <div class="rank-badge rank-{{ you.rank <= 3 ? you.rank : 'other' }}">
            #{{ you.rank }}
          </div>
          <div class="your-rank-info">
            <p class="your-rank-label">Your ranking</p>
            <p class="your-rank-value">{{ you.returnPct | percentFmt:{ signed: true } }} return · {{ you.trades }} trades</p>
          </div>
          <span class="your-tag">You</span>
        </div>
      }

      <!-- Table -->
      <article class="card no-pad">
        <div class="table-wrap">
          <table class="table lb-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Trader</th>
                <th class="num">Portfolio value</th>
                <th class="num">Return</th>
                <th class="num">Trades</th>
              </tr>
            </thead>
            <tbody>
              @for (p of leaderboard(); track p.rank) {
                <tr [class.is-you]="p.isYou">
                  <td>
                    <span class="rank-medal" [class]="'rank-' + (p.rank <= 3 ? p.rank : 'other')">
                      {{ p.rank <= 3 ? medals[p.rank - 1] : p.rank }}
                    </span>
                  </td>
                  <td>
                    <div class="trader-cell">
                      <div class="avatar">{{ p.initials }}</div>
                      <span>{{ p.name }}</span>
                      @if (p.isYou) { <span class="you-badge">You</span> }
                    </div>
                  </td>
                  <td class="num font-mono">{{ p.portfolioValue | currencyFmt }}</td>
                  <td class="num">
                    <span [class.text-green]="p.returnPct >= 0" [class.text-red]="p.returnPct < 0">
                      {{ p.returnPct | percentFmt:{ signed: true } }}
                    </span>
                  </td>
                  <td class="num">{{ p.trades }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </article>
    </div>
  `,
  styleUrl: './competition-detail.component.css',
})
export class CompetitionDetailComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly medals = ['🥇', '🥈', '🥉'];

  protected readonly id = computed(() => this.route.snapshot.paramMap.get('id') ?? '');
  protected readonly title = computed(() => COMPETITION_TITLES[this.id()] ?? 'Competition');
  protected readonly leaderboard = computed(() => LEADERBOARDS[this.id()] ?? LEADERBOARDS['default']);
  protected readonly yourEntry = computed(() => this.leaderboard().find(p => p.isYou) ?? null);
}
