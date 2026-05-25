import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SettingsService } from '../../core/services/settings.service';
import { IconComponent, IconName } from '../../shared/components/icon/icon.component';

type Tab = 'account' | 'trading' | 'notifications' | 'appearance';

interface NavItem { id: Tab; label: string; icon: IconName; }

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <span class="eyebrow">Settings</span>
          <h1 class="page-title">Account &amp; Preferences</h1>
          <p class="page-sub">Manage your profile, trading defaults and notifications.</p>
        </div>
      </header>

      <div class="settings-layout">
        <!-- Sidebar nav -->
        <nav class="settings-nav" aria-label="Settings sections">
          @for (item of navItems; track item.id) {
            <button
              class="nav-item"
              [class.is-active]="activeTab() === item.id"
              (click)="activeTab.set(item.id)"
              [attr.aria-current]="activeTab() === item.id ? 'page' : null"
            >
              <app-icon [name]="item.icon" [size]="16"/>
              {{ item.label }}
            </button>
          }
        </nav>

        <!-- Content panels -->
        <div class="settings-content">

          <!-- Account -->
          @if (activeTab() === 'account') {
            <section class="settings-section" aria-labelledby="tab-account">
              <h2 class="section-title" id="tab-account">Account</h2>

              <div class="field-group">
                <div class="field">
                  <label class="field-label" for="display-name">Display name</label>
                  <input
                    id="display-name"
                    type="text"
                    class="field-input"
                    [value]="user()?.displayName ?? ''"
                    readonly
                  />
                </div>
                <div class="field">
                  <label class="field-label" for="email">Email address</label>
                  <input
                    id="email"
                    type="email"
                    class="field-input"
                    [value]="user()?.email ?? ''"
                    readonly
                  />
                </div>
              </div>

              <div class="field-group">
                <div class="field">
                  <label class="field-label">Portfolio mode</label>
                  <div class="field-info">
                    <span class="badge badge-green">Paper trading</span>
                    <span class="field-hint">Your portfolio uses simulated funds — no real money at risk.</span>
                  </div>
                </div>
                <div class="field">
                  <label class="field-label">Starting balance</label>
                  <div class="field-info">
                    <span class="field-value">$100,000.00</span>
                    <span class="field-hint">Reset by creating a new demo account.</span>
                  </div>
                </div>
              </div>

              <div class="danger-zone">
                <h3 class="danger-title">Danger zone</h3>
                <div class="danger-row">
                  <div>
                    <p class="danger-label">Sign out</p>
                    <p class="danger-desc">You will be redirected to the login page.</p>
                  </div>
                  <button class="btn btn-secondary" (click)="signOut()">Sign out</button>
                </div>
              </div>
            </section>
          }

          <!-- Trading defaults -->
          @if (activeTab() === 'trading') {
            <section class="settings-section" aria-labelledby="tab-trading">
              <h2 class="section-title" id="tab-trading">Trading Defaults</h2>
              <p class="section-desc">These values pre-fill the order form. You can override them per trade.</p>

              <div class="field-group">
                <div class="field">
                  <label class="field-label" for="order-type">Default order type</label>
                  <select
                    id="order-type"
                    class="field-input field-select"
                    [value]="settings.tradingDefaults().orderType"
                    (change)="onOrderTypeChange($event)"
                  >
                    <option value="MARKET">Market order</option>
                    <option value="LIMIT">Limit order</option>
                  </select>
                </div>

                <div class="field">
                  <label class="field-label" for="default-qty">Default quantity</label>
                  <input
                    id="default-qty"
                    type="number"
                    class="field-input"
                    min="1"
                    [value]="settings.tradingDefaults().defaultQuantity"
                    (change)="onQtyChange($event)"
                  />
                  <span class="field-hint">Number of shares / units pre-filled in the order form.</span>
                </div>

                <div class="field">
                  <label class="field-label" for="max-pos">Max position size ($)</label>
                  <input
                    id="max-pos"
                    type="number"
                    class="field-input"
                    min="100"
                    step="100"
                    [value]="settings.tradingDefaults().maxPositionSize"
                    (change)="onMaxPosChange($event)"
                  />
                  <span class="field-hint">Orders above this value will show a risk warning.</span>
                </div>

                <div class="field">
                  <label class="field-label" for="stop-loss">Default stop-loss (%)</label>
                  <input
                    id="stop-loss"
                    type="number"
                    class="field-input"
                    min="0.1"
                    max="50"
                    step="0.1"
                    [value]="settings.tradingDefaults().stopLossPercent"
                    (change)="onStopLossChange($event)"
                  />
                  <span class="field-hint">Percentage below entry price to trigger a stop-loss alert.</span>
                </div>
              </div>
            </section>
          }

          <!-- Notifications -->
          @if (activeTab() === 'notifications') {
            <section class="settings-section" aria-labelledby="tab-notif">
              <h2 class="section-title" id="tab-notif">Notifications</h2>
              <p class="section-desc">Choose which in-app notifications you receive.</p>

              <div class="toggle-list">
                <div class="toggle-row">
                  <div class="toggle-info">
                    <span class="toggle-label">Order execution</span>
                    <span class="toggle-desc">Notify when a market or limit order is filled or cancelled.</span>
                  </div>
                  <button
                    class="toggle"
                    role="switch"
                    [class.is-on]="settings.notificationPrefs().orderExecution"
                    [attr.aria-checked]="settings.notificationPrefs().orderExecution"
                    (click)="toggleNotif('orderExecution')"
                  >
                    <span class="toggle-thumb"></span>
                  </button>
                </div>

                <div class="toggle-row">
                  <div class="toggle-info">
                    <span class="toggle-label">Price alerts</span>
                    <span class="toggle-desc">Notify when a watched asset reaches your target price.</span>
                  </div>
                  <button
                    class="toggle"
                    role="switch"
                    [class.is-on]="settings.notificationPrefs().priceAlerts"
                    [attr.aria-checked]="settings.notificationPrefs().priceAlerts"
                    (click)="toggleNotif('priceAlerts')"
                  >
                    <span class="toggle-thumb"></span>
                  </button>
                </div>

                <div class="toggle-row">
                  <div class="toggle-info">
                    <span class="toggle-label">Risk warnings</span>
                    <span class="toggle-desc">Show warnings when a trade exceeds your max position size.</span>
                  </div>
                  <button
                    class="toggle"
                    role="switch"
                    [class.is-on]="settings.notificationPrefs().riskWarnings"
                    [attr.aria-checked]="settings.notificationPrefs().riskWarnings"
                    (click)="toggleNotif('riskWarnings')"
                  >
                    <span class="toggle-thumb"></span>
                  </button>
                </div>

                <div class="toggle-row">
                  <div class="toggle-info">
                    <span class="toggle-label">Daily summary</span>
                    <span class="toggle-desc">Show a daily P&amp;L summary when you open the app.</span>
                  </div>
                  <button
                    class="toggle"
                    role="switch"
                    [class.is-on]="settings.notificationPrefs().dailySummary"
                    [attr.aria-checked]="settings.notificationPrefs().dailySummary"
                    (click)="toggleNotif('dailySummary')"
                  >
                    <span class="toggle-thumb"></span>
                  </button>
                </div>
              </div>
            </section>
          }

          <!-- Appearance -->
          @if (activeTab() === 'appearance') {
            <section class="settings-section" aria-labelledby="tab-appearance">
              <h2 class="section-title" id="tab-appearance">Appearance</h2>
              <p class="section-desc">Customise the look and feel of PaperTrade Pro.</p>

              <div class="field-group">
                <div class="field">
                  <label class="field-label">Theme</label>
                  <div class="theme-grid">
                    @for (t of themes; track t.value) {
                      <button
                        class="theme-card"
                        [class.is-active]="settings.appearance().theme === t.value"
                        (click)="setTheme(t.value)"
                      >
                        <span class="theme-swatch" [style.background]="t.swatch"></span>
                        <span class="theme-name">{{ t.label }}</span>
                        @if (settings.appearance().theme === t.value) {
                          <span class="theme-badge">Active</span>
                        }
                      </button>
                    }
                  </div>
                </div>

                <div class="field">
                  <label class="field-label" for="accent-color">Accent colour</label>
                  <div class="color-row">
                    <input
                      id="accent-color"
                      type="color"
                      class="color-input"
                      [value]="settings.appearance().accentColor"
                      (input)="onAccentChange($event)"
                    />
                    <span class="field-value">{{ settings.appearance().accentColor }}</span>
                  </div>
                </div>
              </div>

              <div class="toggle-list">
                <div class="toggle-row">
                  <div class="toggle-info">
                    <span class="toggle-label">Compact mode</span>
                    <span class="toggle-desc">Reduce padding and spacing throughout the interface.</span>
                  </div>
                  <button
                    class="toggle"
                    role="switch"
                    [class.is-on]="settings.appearance().compactMode"
                    [attr.aria-checked]="settings.appearance().compactMode"
                    (click)="toggleAppearance('compactMode')"
                  >
                    <span class="toggle-thumb"></span>
                  </button>
                </div>

                <div class="toggle-row">
                  <div class="toggle-info">
                    <span class="toggle-label">Animations</span>
                    <span class="toggle-desc">Enable transitions and motion effects across the UI.</span>
                  </div>
                  <button
                    class="toggle"
                    role="switch"
                    [class.is-on]="settings.appearance().animations"
                    [attr.aria-checked]="settings.appearance().animations"
                    (click)="toggleAppearance('animations')"
                  >
                    <span class="toggle-thumb"></span>
                  </button>
                </div>
              </div>
            </section>
          }

        </div>
      </div>
    </div>
  `,
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  protected readonly auth = inject(AuthService);
  protected readonly settings = inject(SettingsService);
  private readonly router = inject(Router);

  protected readonly user = this.auth.user;

  protected readonly activeTab = signal<Tab>('account');

  protected readonly navItems: NavItem[] = [
    { id: 'account',       label: 'Account',           icon: 'portfolio' as IconName  },
    { id: 'trading',       label: 'Trading Defaults',  icon: 'trade' as IconName      },
    { id: 'notifications', label: 'Notifications',     icon: 'bell' as IconName       },
    { id: 'appearance',    label: 'Appearance',        icon: 'settings' as IconName   },
  ];

  protected readonly themes: { value: 'dark' | 'light' | 'system'; label: string; swatch: string }[] = [
    { value: 'dark',   label: 'Dark',   swatch: 'linear-gradient(135deg, #0a0b0d 50%, #161920 100%)' },
    { value: 'light',  label: 'Light',  swatch: 'linear-gradient(135deg, #f4f6f9 50%, #dde2ec 100%)' },
    { value: 'system', label: 'System', swatch: 'linear-gradient(135deg, #0a0b0d 50%, #f4f6f9 50%)' },
  ];

  protected onOrderTypeChange(e: Event): void {
    const val = (e.target as HTMLSelectElement).value as 'MARKET' | 'LIMIT';
    this.settings.updateTradingDefaults({ orderType: val });
  }

  protected onQtyChange(e: Event): void {
    const val = Number((e.target as HTMLInputElement).value);
    if (val > 0) this.settings.updateTradingDefaults({ defaultQuantity: val });
  }

  protected onMaxPosChange(e: Event): void {
    const val = Number((e.target as HTMLInputElement).value);
    if (val >= 100) this.settings.updateTradingDefaults({ maxPositionSize: val });
  }

  protected onStopLossChange(e: Event): void {
    const val = Number((e.target as HTMLInputElement).value);
    if (val > 0 && val <= 50) this.settings.updateTradingDefaults({ stopLossPercent: val });
  }

  protected toggleNotif(key: keyof import('../../core/services/settings.service').NotificationPrefs): void {
    this.settings.updateNotificationPrefs({ [key]: !this.settings.notificationPrefs()[key] });
  }

  protected toggleAppearance(key: 'compactMode' | 'animations'): void {
    this.settings.updateAppearance({ [key]: !this.settings.appearance()[key] });
  }

  protected onAccentChange(e: Event): void {
    const val = (e.target as HTMLInputElement).value;
    this.settings.updateAppearance({ accentColor: val });
  }

  protected setTheme(t: 'dark' | 'light' | 'system'): void {
    this.settings.updateAppearance({ theme: t });
  }

  protected async signOut(): Promise<void> {
    await this.auth.logout();
    this.router.navigate(['/auth/login']);
  }
}
