import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon.component';

interface FaqItem {
  q: string;
  a: string;
}

interface FaqSection {
  title: string;
  items: FaqItem[];
}

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <span class="eyebrow">Help &amp; Support</span>
          <h1 class="page-title">How can we help?</h1>
          <p class="page-sub">Find answers to common questions about PaperTrade Pro.</p>
        </div>
      </header>

      <!-- Quick links -->
      <section class="quick-grid">
        @for (link of quickLinks; track link.title) {
          <a [routerLink]="link.route" class="quick-card">
            <app-icon [name]="$any(link.icon)" [size]="20"/>
            <span class="quick-title">{{ link.title }}</span>
            <span class="quick-desc">{{ link.desc }}</span>
          </a>
        }
      </section>

      <!-- FAQ sections -->
      <section class="faq-section">
        @for (section of faqSections; track section.title) {
          <div class="faq-group">
            <h2 class="faq-group-title">{{ section.title }}</h2>
            @for (item of section.items; track item.q) {
              <div class="faq-item" [class.is-open]="openId() === (section.title + item.q)">
                <button
                  class="faq-question"
                  (click)="toggle(section.title + item.q)"
                  [attr.aria-expanded]="openId() === (section.title + item.q)"
                >
                  <span>{{ item.q }}</span>
                  <app-icon name="chevron-down" [size]="14"/>
                </button>
                <div class="faq-answer">
                  <p>{{ item.a }}</p>
                </div>
              </div>
            }
          </div>
        }
      </section>

      <!-- Contact -->
      <section class="contact-card">
        <div class="contact-info">
          <h3 class="contact-title">Still need help?</h3>
          <p class="contact-desc">Our support team usually responds within a few hours.</p>
        </div>
        <a href="mailto:support@papertrade.pro" class="btn btn-primary">
          <app-icon name="help" [size]="14"/>
          Contact support
        </a>
      </section>
    </div>
  `,
  styleUrl: './help.component.css',
})
export class HelpComponent {
  protected readonly openId = signal<string | null>(null);

  protected readonly quickLinks = [
    { title: 'Dashboard',  desc: 'Overview of your portfolio',  icon: 'dashboard',     route: '/dashboard'  },
    { title: 'Markets',    desc: 'Browse and search assets',    icon: 'markets',       route: '/markets'    },
    { title: 'Trade',      desc: 'Place your first order',      icon: 'trade',         route: '/trade/AAPL' },
    { title: 'Analytics',  desc: 'Review your performance',     icon: 'analytics',     route: '/analytics'  },
  ];

  protected readonly faqSections: FaqSection[] = [
    {
      title: 'Getting started',
      items: [
        { q: 'What is paper trading?', a: 'Paper trading is simulated trading where you practise buying and selling assets using virtual money. There is no real money involved, so you can experiment with strategies risk-free.' },
        { q: 'How much virtual money do I start with?', a: 'Every account starts with $100,000 in virtual funds. This balance resets if you create a new demo account.' },
        { q: 'Is the market data real?', a: 'PaperTrade Pro uses deterministic seed data that mirrors realistic market behaviour. Live data integration is on the roadmap.' },
      ],
    },
    {
      title: 'Orders & trading',
      items: [
        { q: 'What order types are supported?', a: 'Market orders execute instantly at the current price. Limit orders sit in a pending state until the target price is reached (simulation only — they are not connected to a real exchange).' },
        { q: 'Can I short sell?', a: 'Not yet. Short selling is on the roadmap. Currently you can only buy and sell assets you hold.' },
        { q: 'How is my P&L calculated?', a: 'Unrealised P&L is calculated as (current price − average cost) × quantity for each holding. Daily P&L uses the intraday price change × quantity held.' },
        { q: 'What happens to my cancelled orders?', a: 'Cancelled orders appear in the Orders history with a CANCELLED badge. They have no effect on your cash balance or positions.' },
      ],
    },
    {
      title: 'Portfolio & analytics',
      items: [
        { q: 'How is win rate calculated?', a: 'Win rate is the percentage of filled trades where the price has moved in your favour since execution — buys where the current price is higher, and sells where you sold above the current price.' },
        { q: 'Can I reset my portfolio?', a: 'Portfolio reset is not available in this version. You can create a fresh demo account to start with $100,000 again.' },
      ],
    },
    {
      title: 'Account & settings',
      items: [
        { q: 'How do I change my trading defaults?', a: 'Go to Settings → Trading Defaults. You can set your preferred order type, default quantity, max position size, and stop-loss percentage.' },
        { q: 'Are my settings saved between sessions?', a: 'Yes, your settings are stored in your browser\'s localStorage so they persist across sessions on the same device.' },
      ],
    },
  ];

  protected toggle(id: string): void {
    this.openId.update(current => current === id ? null : id);
  }
}
