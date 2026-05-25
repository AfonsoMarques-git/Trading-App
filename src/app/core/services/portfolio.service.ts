import { effect, inject, Injectable, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Holding, PortfolioSummary, Trade } from '../models/portfolio.model';
import { MarketDataService } from './market-data.service';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

interface RawPosition {
  symbol: string;
  quantity: number;
  averagePrice: number;
}

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private readonly market = inject(MarketDataService);
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _cashBalance = signal<number>(0);
  private readonly _positions = signal<RawPosition[]>([]);
  private readonly _trades = signal<Trade[]>([]);

  readonly cashBalance = this._cashBalance.asReadonly();
  readonly trades = this._trades.asReadonly();

  readonly holdings = computed<Holding[]>(() =>
    this._positions().map(p => {
      const asset = this.market.getBySymbol(p.symbol);
      const currentPrice = asset?.price ?? p.averagePrice;
      const marketValue = currentPrice * p.quantity;
      const cost = p.averagePrice * p.quantity;
      const unrealizedPnL = marketValue - cost;
      const unrealizedPnLPercent = cost > 0 ? (unrealizedPnL / cost) * 100 : 0;
      return {
        symbol: p.symbol,
        name: asset?.name ?? p.symbol,
        quantity: p.quantity,
        averagePrice: p.averagePrice,
        currentPrice,
        marketValue,
        unrealizedPnL,
        unrealizedPnLPercent,
      };
    }),
  );

  readonly holdingsValue = computed(() =>
    this.holdings().reduce((s, h) => s + h.marketValue, 0),
  );

  readonly totalValue = computed(() => this._cashBalance() + this.holdingsValue());

  readonly summary = computed<PortfolioSummary>(() => {
    const holdings = this.holdings();
    const holdingsValue = this.holdingsValue();
    const totalValue = this.totalValue();
    const cost = holdings.reduce((s, h) => s + h.averagePrice * h.quantity, 0);
    const totalPnL = holdings.reduce((s, h) => s + h.unrealizedPnL, 0);
    const totalPnLPercent = cost > 0 ? (totalPnL / cost) * 100 : 0;

    const dailyPnL = holdings.reduce((sum, h) => {
      const asset = this.market.getBySymbol(h.symbol);
      return asset ? sum + asset.change * h.quantity : sum;
    }, 0);
    const yesterdayValue = holdingsValue - dailyPnL;
    const dailyPnLPercent = yesterdayValue > 0 ? (dailyPnL / yesterdayValue) * 100 : 0;

    const filled = this._trades().filter(t => t.status === 'FILLED');
    const wins = filled.filter(t => {
      const asset = this.market.getBySymbol(t.symbol);
      if (!asset) return false;
      return t.side === 'BUY' ? asset.price > t.price : asset.price < t.price;
    });
    const winRate = filled.length > 0 ? (wins.length / filled.length) * 100 : 0;

    return {
      cashBalance: this._cashBalance(),
      holdingsValue,
      totalValue,
      dailyPnL,
      dailyPnLPercent,
      totalPnL,
      totalPnLPercent,
      winRate,
      totalTrades: filled.length,
    };
  });

  constructor() {
    if (!this.isBrowser) return;
    effect(() => {
      const user = this.auth.user();
      if (user) {
        this.loadFromSupabase(user.id);
      } else {
        this.reset();
      }
    });
  }

  private reset(): void {
    this._cashBalance.set(0);
    this._positions.set([]);
    this._trades.set([]);
  }

  private async loadFromSupabase(userId: string): Promise<void> {
    const [profileRes, posRes, tradeRes] = await Promise.all([
      this.supabase.client.from('profiles').select('cash_balance').eq('id', userId).single(),
      this.supabase.client.from('positions').select('*').eq('user_id', userId),
      this.supabase.client.from('trades').select('*').eq('user_id', userId).order('executed_at', { ascending: false }),
    ]);

    if (profileRes.error) console.error('[portfolio] profiles query failed:', profileRes.error);
    if (profileRes.data) {
      this._cashBalance.set(Number(profileRes.data.cash_balance));
    }

    if (posRes.error) console.error('[portfolio] positions query failed:', posRes.error);
    if (posRes.data) {
      this._positions.set(posRes.data.map((r: any) => ({
        symbol: r.symbol,
        quantity: Number(r.quantity),
        averagePrice: Number(r.average_price),
      })));
    }

    if (tradeRes.error) console.error('[portfolio] trades query failed:', tradeRes.error);
    if (tradeRes.data) {
      this._trades.set(tradeRes.data.map((r: any) => ({
        id: r.id,
        timestamp: new Date(r.executed_at),
        symbol: r.symbol,
        side: r.side as 'BUY' | 'SELL',
        type: r.order_type as 'MARKET' | 'LIMIT',
        quantity: Number(r.quantity),
        price: Number(r.price),
        total: Number(r.total),
        status: r.status as Trade['status'],
      })));
    }
  }

  submitOrder(input: {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT';
    quantity: number;
    limitPrice?: number;
  }): { ok: true; trade: Trade } | { ok: false; error: string } {
    const asset = this.market.getBySymbol(input.symbol);
    if (!asset) return { ok: false, error: `Unknown symbol: ${input.symbol}` };
    if (input.quantity <= 0) return { ok: false, error: 'Quantity must be greater than zero.' };

    const fillPrice = input.type === 'MARKET' ? asset.price : (input.limitPrice ?? asset.price);
    const total = +(fillPrice * input.quantity).toFixed(2);

    if (input.side === 'BUY' && total > this._cashBalance()) {
      return { ok: false, error: 'Insufficient cash balance.' };
    }
    if (input.side === 'SELL') {
      const pos = this._positions().find(p => p.symbol === input.symbol);
      if (!pos || pos.quantity < input.quantity) {
        return { ok: false, error: 'Insufficient shares to sell.' };
      }
    }

    const trade: Trade = {
      id: `t-${Math.floor(Math.random() * 99999).toString().padStart(5, '0')}`,
      timestamp: new Date(),
      symbol: input.symbol,
      side: input.side,
      type: input.type,
      quantity: input.quantity,
      price: fillPrice,
      total,
      status: input.type === 'MARKET' ? 'FILLED' : 'PENDING',
    };

    if (trade.status === 'FILLED') this.applyFill(trade);
    this._trades.update(prev => [trade, ...prev]);

    // Persist to Supabase in background
    this.persistOrder(trade).catch(e => console.error('[portfolio] persist error', e));
    return { ok: true, trade };
  }

  private applyFill(trade: Trade): void {
    const delta = trade.side === 'BUY' ? -trade.total : trade.total;
    this._cashBalance.update(c => +(c + delta).toFixed(2));

    this._positions.update(positions => {
      const idx = positions.findIndex(p => p.symbol === trade.symbol);
      if (trade.side === 'BUY') {
        if (idx === -1) {
          return [...positions, { symbol: trade.symbol, quantity: trade.quantity, averagePrice: trade.price }];
        }
        const ex = positions[idx];
        const newQty = ex.quantity + trade.quantity;
        const newAvg = (ex.quantity * ex.averagePrice + trade.quantity * trade.price) / newQty;
        const updated = [...positions];
        updated[idx] = { ...ex, quantity: newQty, averagePrice: newAvg };
        return updated;
      }
      if (idx === -1) return positions;
      const ex = positions[idx];
      const newQty = ex.quantity - trade.quantity;
      if (newQty <= 0) return positions.filter(p => p.symbol !== trade.symbol);
      const updated = [...positions];
      updated[idx] = { ...ex, quantity: newQty };
      return updated;
    });
  }

  private async persistOrder(trade: Trade): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    const pos = this._positions().find(p => p.symbol === trade.symbol);
    const cashBalance = this._cashBalance();

    await Promise.all([
      this.supabase.client.from('trades').insert({
        id: trade.id,
        user_id: userId,
        executed_at: trade.timestamp.toISOString(),
        symbol: trade.symbol,
        side: trade.side,
        order_type: trade.type,
        quantity: trade.quantity,
        price: trade.price,
        total: trade.total,
        status: trade.status,
      }),
      this.supabase.client.from('profiles')
        .update({ cash_balance: cashBalance, updated_at: new Date().toISOString() })
        .eq('id', userId),
      pos
        ? this.supabase.client.from('positions').upsert({
            user_id: userId,
            symbol: trade.symbol,
            quantity: pos.quantity,
            average_price: pos.averagePrice,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,symbol' })
        : this.supabase.client.from('positions')
            .delete()
            .eq('user_id', userId)
            .eq('symbol', trade.symbol),
    ]);
  }
}
