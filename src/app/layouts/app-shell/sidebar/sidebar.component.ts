import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent, IconName } from '../../../shared/components/icon/icon.component';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: IconName;
  path: string;
  exact?: boolean;
}

const PRIMARY_NAV: NavItem[] = [
  { label: 'Dashboard',    icon: 'dashboard',   path: '/dashboard' },
  { label: 'Markets',      icon: 'markets',     path: '/markets' },
  { label: 'Portfolio',    icon: 'portfolio',   path: '/portfolio' },
  { label: 'Orders',       icon: 'orders',      path: '/orders' },
  { label: 'Watchlist',    icon: 'watchlist',   path: '/watchlist' },
  { label: 'Analytics',    icon: 'analytics',   path: '/analytics' },
  { label: 'AI Assistant', icon: 'ai',          path: '/ai-assistant' },
  { label: 'Competitions', icon: 'trophy',      path: '/competitions' },
  { label: 'Academy',      icon: 'academy',     path: '/academy' },
  { label: 'Alerts',       icon: 'alerts',      path: '/alerts' },
];

const SECONDARY_NAV: NavItem[] = [
  { label: 'Achievements', icon: 'achievements', path: '/achievements' },
  { label: 'Settings',     icon: 'settings',     path: '/settings' },
  { label: 'Help',         icon: 'help',         path: '/help' },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="sidebar" [class.is-expanded]="expanded()" [attr.aria-expanded]="expanded()">
      <button class="brand" (click)="toggle()" [attr.aria-label]="'Toggle sidebar'">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="22" height="22">
            <defs>
              <linearGradient id="brand-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#6366f1"/>
                <stop offset="1" stop-color="#10b981"/>
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#brand-g)"/>
            <path d="M6 22 L12 14 L18 18 L26 8" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <span class="brand-text">
          <span class="brand-name">PaperTrade</span>
          <span class="brand-suffix">Pro</span>
        </span>
      </button>

      <nav class="nav" aria-label="Primary">
        <ul>
          @for (item of primaryNav; track item.path) {
            <li>
              <a
                [routerLink]="item.path"
                routerLinkActive="is-active"
                [routerLinkActiveOptions]="{ exact: false }"
                [attr.title]="!expanded() ? item.label : null"
                class="nav-link"
              >
                <span class="nav-icon"><app-icon [name]="item.icon" [size]="18"/></span>
                <span class="nav-label">{{ item.label }}</span>
              </a>
            </li>
          }
        </ul>
      </nav>

      <div class="divider" aria-hidden="true"></div>

      <nav class="nav nav-secondary" aria-label="Secondary">
        <ul>
          @for (item of secondaryNav; track item.path) {
            <li>
              <a
                [routerLink]="item.path"
                routerLinkActive="is-active"
                [attr.title]="!expanded() ? item.label : null"
                class="nav-link"
              >
                <span class="nav-icon"><app-icon [name]="item.icon" [size]="18"/></span>
                <span class="nav-label">{{ item.label }}</span>
              </a>
            </li>
          }
        </ul>
      </nav>

      <div class="user">
        @if (user(); as u) {
          <div class="avatar" aria-hidden="true">{{ u.initials }}</div>
          <div class="user-meta">
            <span class="user-name">{{ u.displayName }}</span>
            <span class="user-email">{{ u.email }}</span>
          </div>
          <button class="logout-btn" (click)="logout()" aria-label="Sign out" title="Sign out">
            <app-icon name="logout" [size]="16"/>
          </button>
        } @else {
          <a routerLink="/auth/login" class="logout-btn" title="Sign in">
            <app-icon name="logout" [size]="16"/>
          </a>
        }
      </div>
    </aside>
  `,
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  protected readonly user = this.auth.user;

  protected readonly primaryNav = PRIMARY_NAV;
  protected readonly secondaryNav = SECONDARY_NAV;

  protected readonly expanded = signal(true);

  toggle() {
    this.expanded.update(v => !v);
  }

  logout() {
    this.auth.logout();
  }
}
