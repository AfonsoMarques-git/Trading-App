import { effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

export interface TradingDefaults {
  orderType: 'MARKET' | 'LIMIT';
  defaultQuantity: number;
  maxPositionSize: number;
  stopLossPercent: number;
}

export interface NotificationPrefs {
  orderExecution: boolean;
  priceAlerts: boolean;
  riskWarnings: boolean;
  dailySummary: boolean;
}

export interface AppearanceSettings {
  accentColor: string;
  compactMode: boolean;
  animations: boolean;
  theme: 'dark' | 'light' | 'system';
}

const DEFAULT_TRADING: TradingDefaults = {
  orderType: 'MARKET', defaultQuantity: 10, maxPositionSize: 5000, stopLossPercent: 2,
};
const DEFAULT_NOTIF: NotificationPrefs = {
  orderExecution: true, priceAlerts: true, riskWarnings: true, dailySummary: false,
};
const DEFAULT_APPEARANCE: AppearanceSettings = {
  accentColor: '#6366f1', compactMode: false, animations: true, theme: 'dark',
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly tradingDefaults = signal<TradingDefaults>({ ...DEFAULT_TRADING });
  readonly notificationPrefs = signal<NotificationPrefs>({ ...DEFAULT_NOTIF });
  readonly appearance = signal<AppearanceSettings>({ ...DEFAULT_APPEARANCE });

  constructor() {
    if (!this.isBrowser) return;

    effect(() => {
      const user = this.auth.user();
      if (user) this.load(user.id);
      else this.resetDefaults();
    });

    // Reactively apply appearance settings to the DOM whenever they change
    effect(() => this.applyAppearance(this.appearance()));
  }

  private resetDefaults(): void {
    this.tradingDefaults.set({ ...DEFAULT_TRADING });
    this.notificationPrefs.set({ ...DEFAULT_NOTIF });
    this.appearance.set({ ...DEFAULT_APPEARANCE });
  }

  private async load(userId: string): Promise<void> {
    const { data } = await this.supabase.client
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (data) {
      this.tradingDefaults.set({ ...DEFAULT_TRADING, ...data.trading_defaults });
      this.notificationPrefs.set({ ...DEFAULT_NOTIF, ...data.notification_prefs });
      this.appearance.set({ ...DEFAULT_APPEARANCE, ...data.appearance });
    }
  }

  private async save(): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) return;
    await this.supabase.client.from('user_settings').upsert({
      user_id: userId,
      trading_defaults: this.tradingDefaults(),
      notification_prefs: this.notificationPrefs(),
      appearance: this.appearance(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  }

  // ── DOM application ──────────────────────────────────────────────────────

  private applyAppearance(a: AppearanceSettings): void {
    const doc = document.documentElement;

    // Accent colour + derived variants
    const rgb = this.hexToRgb(a.accentColor);
    if (rgb) {
      doc.style.setProperty('--color-accent', a.accentColor);
      doc.style.setProperty('--color-accent-hover', this.darkenHex(a.accentColor, 0.15));
      doc.style.setProperty('--color-accent-soft',  `rgba(${rgb.r},${rgb.g},${rgb.b},0.12)`);
      doc.style.setProperty('--color-accent-glow',  `rgba(${rgb.r},${rgb.g},${rgb.b},0.25)`);
    }

    // Utility classes on <body>
    document.body.classList.toggle('compact-mode',  a.compactMode);
    document.body.classList.toggle('no-animations', !a.animations);

    // Theme via data attribute on <html>
    doc.setAttribute('data-theme', a.theme ?? 'dark');
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
  }

  private darkenHex(hex: string, amount: number): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;
    const r = Math.max(0, Math.round(rgb.r * (1 - amount)));
    const g = Math.max(0, Math.round(rgb.g * (1 - amount)));
    const b = Math.max(0, Math.round(rgb.b * (1 - amount)));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // ── Public update methods ────────────────────────────────────────────────

  updateTradingDefaults(patch: Partial<TradingDefaults>): void {
    this.tradingDefaults.update(v => ({ ...v, ...patch }));
    this.save().catch(console.error);
  }

  updateNotificationPrefs(patch: Partial<NotificationPrefs>): void {
    this.notificationPrefs.update(v => ({ ...v, ...patch }));
    this.save().catch(console.error);
  }

  updateAppearance(patch: Partial<AppearanceSettings>): void {
    this.appearance.update(v => ({ ...v, ...patch }));
    this.save().catch(console.error);
  }
}
