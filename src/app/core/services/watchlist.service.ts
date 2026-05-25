import { effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class WatchlistService {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly symbols = signal<string[]>([]);

  constructor() {
    if (!this.isBrowser) return;
    effect(() => {
      const user = this.auth.user();
      if (user) this.load(user.id);
      else this.symbols.set([]);
    });
  }

  private async load(userId: string): Promise<void> {
    const { data } = await this.supabase.client
      .from('watchlist')
      .select('symbol')
      .eq('user_id', userId)
      .order('created_at');
    if (data) this.symbols.set(data.map((r: any) => r.symbol));
  }

  async add(symbol: string): Promise<void> {
    const s = symbol.toUpperCase().trim();
    const userId = this.auth.user()?.id;
    if (!s || this.symbols().includes(s) || !userId) return;
    this.symbols.update(prev => [...prev, s]);
    await this.supabase.client.from('watchlist').insert({ user_id: userId, symbol: s });
  }

  async remove(symbol: string): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) return;
    this.symbols.update(prev => prev.filter(s => s !== symbol));
    await this.supabase.client.from('watchlist')
      .delete().eq('user_id', userId).eq('symbol', symbol);
  }

  has(symbol: string): boolean {
    return this.symbols().includes(symbol.toUpperCase());
  }
}
