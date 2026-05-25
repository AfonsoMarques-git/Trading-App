import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

export interface FinnhubQuote {
  c: number;   // current price
  d: number;   // change
  dp: number;  // change percent
  h: number;   // high
  l: number;   // low
  o: number;   // open
  pc: number;  // previous close
}

// Finnhub uses exchange-prefixed symbols for crypto
const SYMBOL_MAP: Record<string, string> = {
  'BTC-USD':   'BINANCE:BTCUSDT',
  'ETH-USD':   'BINANCE:ETHUSDT',
  'SOL-USD':   'BINANCE:SOLUSDT',
  'BNB-USD':   'BINANCE:BNBUSDT',
  'XRP-USD':   'BINANCE:XRPUSDT',
  'DOGE-USD':  'BINANCE:DOGEUSDT',
  'ADA-USD':   'BINANCE:ADAUSDT',
  'AVAX-USD':  'BINANCE:AVAXUSDT',
  'DOT-USD':   'BINANCE:DOTUSDT',
  'MATIC-USD': 'BINANCE:MATICUSDT',
  'LINK-USD':  'BINANCE:LINKUSDT',
  'LTC-USD':   'BINANCE:LTCUSDT',
  'SHIB-USD':  'BINANCE:SHIBUSDT',
  'TRX-USD':   'BINANCE:TRXUSDT',
};

@Injectable({ providedIn: 'root' })
export class FinnhubService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private ws: WebSocket | null = null;
  private priceCallback: ((finnhubSymbol: string, price: number) => void) | null = null;
  private subscribedSymbols: string[] = [];

  // Cache keyed by appSymbol_resolution_fromHour so the same window reuses data
  private readonly candleCache = new Map<string, number[]>();

  get isConfigured(): boolean {
    return !!environment.finnhubApiKey;
  }

  private get apiKey(): string {
    return environment.finnhubApiKey;
  }

  toFinnhubSymbol(appSymbol: string): string {
    return SYMBOL_MAP[appSymbol] ?? appSymbol;
  }

  async fetchQuote(appSymbol: string): Promise<FinnhubQuote | null> {
    if (!this.isConfigured || !this.isBrowser) return null;
    try {
      const sym = this.toFinnhubSymbol(appSymbol);
      const res = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(sym)}&token=${this.apiKey}`,
      );
      if (!res.ok) return null;
      const data = await res.json() as FinnhubQuote;
      return data.c > 0 ? data : null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch historical close prices for a symbol.
   * @param appSymbol  Internal symbol (e.g. 'AAPL', 'BTC-USD')
   * @param isCrypto   Whether to use the crypto/candle endpoint
   * @param resolution Finnhub resolution string: '15', '60', 'D', 'W'
   * @param fromSec    Unix timestamp (seconds) for the start of the window
   * @param toSec      Unix timestamp (seconds) for the end of the window
   * @returns          Array of closing prices ordered oldest → newest, or null on failure
   */
  async fetchCandles(
    appSymbol: string,
    isCrypto: boolean,
    resolution: string,
    fromSec: number,
    toSec: number,
  ): Promise<number[] | null> {
    if (!this.isConfigured || !this.isBrowser) return null;

    // Cache key: bucket fromSec to the nearest hour so repeated calls in the same
    // hour window reuse data instead of hitting the API every time.
    const cacheKey = `${appSymbol}_${resolution}_${Math.floor(fromSec / 3600)}`;
    const cached = this.candleCache.get(cacheKey);
    if (cached) return cached;

    try {
      const sym = this.toFinnhubSymbol(appSymbol);
      const endpoint = isCrypto ? 'crypto/candle' : 'stock/candle';
      const url =
        `https://finnhub.io/api/v1/${endpoint}` +
        `?symbol=${encodeURIComponent(sym)}` +
        `&resolution=${resolution}` +
        `&from=${fromSec}` +
        `&to=${toSec}` +
        `&token=${this.apiKey}`;

      const res = await fetch(url);
      if (!res.ok) return null;

      const data = await res.json() as { s: string; c?: number[] };
      if (data.s !== 'ok' || !data.c?.length) return null;

      this.candleCache.set(cacheKey, data.c);
      return data.c;
    } catch {
      return null;
    }
  }

  connectWebSocket(
    appSymbols: string[],
    onPrice: (finnhubSymbol: string, price: number) => void,
  ): void {
    if (!this.isConfigured || !this.isBrowser) return;
    this.priceCallback = onPrice;
    this.subscribedSymbols = appSymbols.map(s => this.toFinnhubSymbol(s));
    this.openSocket();
  }

  private openSocket(): void {
    if (this.ws) { this.ws.close(); this.ws = null; }
    if (typeof WebSocket === 'undefined') return;

    this.ws = new WebSocket(`wss://ws.finnhub.io?token=${this.apiKey}`);

    this.ws.addEventListener('open', () => {
      for (const sym of this.subscribedSymbols) {
        this.ws?.send(JSON.stringify({ type: 'subscribe', symbol: sym }));
      }
    });

    this.ws.addEventListener('message', (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as { type: string; data: { p: number; s: string }[] };
        if (msg.type === 'trade' && Array.isArray(msg.data)) {
          for (const trade of msg.data) {
            this.priceCallback?.(trade.s, trade.p);
          }
        }
      } catch { /* ignore malformed messages */ }
    });

    this.ws.addEventListener('close', () => {
      this.ws = null;
      if (this.priceCallback) setTimeout(() => this.openSocket(), 5000);
    });
  }

  disconnect(): void {
    this.priceCallback = null;
    this.subscribedSymbols = [];
    this.ws?.close();
    this.ws = null;
  }
}
