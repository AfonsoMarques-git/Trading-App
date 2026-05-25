import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon.component';


interface Competition {
  id: string;
  title: string;
  desc: string;
  prize: string;
  starts: string;
  ends: string;
  participants: number;
  status: 'live' | 'upcoming' | 'ended';
  joined: boolean;
}

@Component({
  selector: 'app-competitions',
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <span class="eyebrow">Competitions</span>
          <h1 class="page-title">Trading challenges</h1>
          <p class="page-sub">Compete with other traders and climb the leaderboard.</p>
        </div>
      </header>

      <div class="comp-grid">
        @for (c of competitions(); track c.id) {
          <article class="comp-card" [class]="'status-' + c.status">
            <div class="comp-header">
              <div class="comp-status-badge" [class]="'badge-' + c.status">
                {{ c.status === 'live' ? 'Live now' : c.status === 'upcoming' ? 'Upcoming' : 'Ended' }}
              </div>
              <span class="comp-prize">{{ c.prize }}</span>
            </div>
            <h2 class="comp-title">{{ c.title }}</h2>
            <p class="comp-desc">{{ c.desc }}</p>
            <div class="comp-meta">
              <span class="comp-stat">
                <app-icon name="portfolio" [size]="12"/>
                {{ c.participants }} traders
              </span>
              <span class="comp-stat">
                <app-icon name="analytics" [size]="12"/>
                {{ c.starts }} – {{ c.ends }}
              </span>
            </div>
            <div class="comp-actions">
              <a [routerLink]="['/competitions', c.id]" class="btn btn-secondary">View leaderboard</a>
              @if (c.status !== 'ended') {
                <button
                  class="btn"
                  [class.btn-primary]="!c.joined"
                  [class.btn-secondary]="c.joined"
                  (click)="toggleJoin(c.id)"
                >{{ c.joined ? 'Leave' : 'Join' }}</button>
              }
            </div>
          </article>
        }
      </div>
    </div>
  `,
  styleUrl: './competitions.component.css',
})
export class CompetitionsComponent {
  protected readonly competitions = signal<Competition[]>([
    { id: 'weekly-may',     title: 'Weekly Challenge — May',   desc: 'Highest portfolio return over 7 days wins. Starting balance $100k.',      prize: '🏆 Top trader badge', starts: 'May 13', ends: 'May 20', participants: 248, status: 'live',     joined: true  },
    { id: 'crypto-sprint',  title: 'Crypto Sprint',            desc: 'Trade only crypto assets. Best P&L in 48 hours takes the crown.',         prize: '🥇 Crypto master badge', starts: 'May 19', ends: 'May 21', participants: 102, status: 'upcoming', joined: false },
    { id: 'steady-returns', title: 'Steady Returns Cup',       desc: 'Win rate matters more than raw P&L. Consistency is king.',               prize: '📈 Consistency badge', starts: 'May 21', ends: 'May 28', participants: 57,  status: 'upcoming', joined: false },
    { id: 'april-open',     title: 'April Open Championship',  desc: 'Month-long open competition. All assets, all strategies.',               prize: '🎖 Champion badge', starts: 'Apr 1',  ends: 'Apr 30', participants: 431, status: 'ended',    joined: false },
  ]);

  protected toggleJoin(id: string): void {
    this.competitions.update(prev =>
      prev.map(c => c.id === id ? { ...c, joined: !c.joined, participants: c.joined ? c.participants - 1 : c.participants + 1 } : c),
    );
  }
}
