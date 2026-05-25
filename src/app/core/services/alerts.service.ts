import { effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

export type AlertCondition = 'above' | 'below';

export interface PriceAlert {
  id: string;
  symbol: string;
  condition: AlertCondition;
  targetPrice: number;
  active: boolean;
  createdAt: Date;
  triggeredAt?: Date;
}

@Injectable({ providedIn: 'root' })
export class AlertsService {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly alerts = signal<PriceAlert[]>([]);

  constructor() {
    if (!this.isBrowser) return;
    effect(() => {
      const user = this.auth.user();
      if (user) this.load(user.id);
      else this.alerts.set([]);
    });
  }

  private async load(userId: string): Promise<void> {
    const { data } = await this.supabase.client
      .from('price_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) {
      this.alerts.set(data.map((r: any) => ({
        id: r.id,
        symbol: r.symbol,
        condition: r.condition as AlertCondition,
        targetPrice: Number(r.target_price),
        active: r.active,
        createdAt: new Date(r.created_at),
        triggeredAt: r.triggered_at ? new Date(r.triggered_at) : undefined,
      })));
    }
  }

  async create(symbol: string, condition: AlertCondition, targetPrice: number): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) return;
    const alert: PriceAlert = {
      id: `a-${Math.random().toString(36).slice(2, 7)}`,
      symbol: symbol.toUpperCase().trim(),
      condition,
      targetPrice,
      active: true,
      createdAt: new Date(),
    };
    this.alerts.update(prev => [alert, ...prev]);
    await this.supabase.client.from('price_alerts').insert({
      id: alert.id, user_id: userId, symbol: alert.symbol,
      condition, target_price: targetPrice, active: true,
    });
  }

  async delete(id: string): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) return;
    this.alerts.update(prev => prev.filter(a => a.id !== id));
    await this.supabase.client.from('price_alerts').delete().eq('id', id).eq('user_id', userId);
  }

  async toggle(id: string): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) return;
    const alert = this.alerts().find(a => a.id === id);
    if (!alert) return;
    const newActive = !alert.active;
    this.alerts.update(prev => prev.map(a => a.id === id ? { ...a, active: newActive } : a));
    await this.supabase.client.from('price_alerts').update({ active: newActive }).eq('id', id).eq('user_id', userId);
  }
}
