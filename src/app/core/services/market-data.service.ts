import { inject, Injectable, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Asset } from '../models/asset.model';
import { FinnhubService, FinnhubQuote } from './finnhub.service';

/**
 * Seed-data synthetic sparkline — used only before any API data arrives.
 * Noise is proportional to the price so it works for both AAPL ($234) and SHIB ($0.0000245).
 */
function buildSparkline(endPrice: number, changePercent: number, seed: number): number[] {
  const points = 20;
  const startPrice = endPrice / (1 + changePercent / 100);
  let s = seed;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const data: number[] = [];
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const base = startPrice + (endPrice - startPrice) * t;
    const noise = (rand() - 0.5) * (endPrice * 0.012);
    data.push(+(base + noise).toFixed(8));
  }
  data[0] = +startPrice.toFixed(8);
  data[points - 1] = +endPrice.toFixed(8);
  return data;
}

/**
 * Improved synthetic sparkline built from a real Finnhub quote's OHLC data.
 * Replaces the seed sparkline once the first price-batch completes.
 * The path respects the actual high/low/open/prevClose anchors so the shape
 * reflects the real intraday character of the asset (bullish dip-and-recover vs
 * bearish spike-and-selloff) rather than pure random noise.
 */
function buildSparklineFromOHLC(
  prevClose: number,
  open: number,
  high: number,
  low: number,
  close: number,
  seed: number,
): number[] {
  const POINTS = 24;
  let s = seed;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };

  const range     = Math.max(high - low, Math.abs(close - prevClose) * 0.1, close * 0.002);
  const isBullish = close >= open;

  const pts: number[] = [prevClose]; // start at yesterday's close
  for (let i = 1; i < POINTS - 1; i++) {
    const t    = i / (POINTS - 1);
    const base = open + (close - open) * t; // linear open → close
    // Arch toward the day's extreme in the middle of the session
    const arch = Math.sin(Math.PI * t) *
                 (isBullish ? (low  - open) * 0.45 : (high - open) * 0.45);
    const noise = (rand() - 0.5) * range * 0.12;
    pts.push(+(base + arch + noise).toFixed(8));
  }
  pts.push(close); // always end at the real current price
  return pts;
}

/** Symbols to subscribe to via WebSocket (top-tier liquidity, most likely to stream) */
const REALTIME_SYMBOLS = [
  'AAPL', 'MSFT', 'NVDA', 'TSLA', 'META', 'GOOGL', 'AMZN', 'AMD', 'NFLX', 'V',
  'BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'DOGE-USD',
  'SPY', 'QQQ', 'JPM', 'LLY', 'AVGO',
];

const SEED_ASSETS: Omit<Asset, 'sparklineData'>[] = [
  // ── TECHNOLOGY ──────────────────────────────────────────────────────────────
  { symbol: 'AAPL',  name: 'Apple Inc.',              category: 'stock', sector: 'Technology',     price:  234.18, change:   2.41, changePercent:  1.04, volume:  48_213_900, marketCap: 3_540_000_000_000 },
  { symbol: 'MSFT',  name: 'Microsoft Corp.',         category: 'stock', sector: 'Technology',     price:  442.67, change:   3.18, changePercent:  0.72, volume:  21_409_700, marketCap: 3_290_000_000_000 },
  { symbol: 'NVDA',  name: 'NVIDIA Corp.',            category: 'stock', sector: 'Technology',     price:  148.32, change:   6.94, changePercent:  4.91, volume: 188_413_500, marketCap: 3_640_000_000_000 },
  { symbol: 'AMD',   name: 'Advanced Micro Devices',  category: 'stock', sector: 'Technology',     price:  168.90, change:   4.12, changePercent:  2.50, volume:  42_811_200, marketCap:   273_000_000_000 },
  { symbol: 'INTC',  name: 'Intel Corp.',             category: 'stock', sector: 'Technology',     price:   21.45, change:  -0.32, changePercent: -1.47, volume:  68_241_300, marketCap:    91_000_000_000 },
  { symbol: 'QCOM',  name: 'Qualcomm Inc.',           category: 'stock', sector: 'Technology',     price:  175.42, change:   1.85, changePercent:  1.07, volume:  14_522_100, marketCap:   195_000_000_000 },
  { symbol: 'AVGO',  name: 'Broadcom Inc.',           category: 'stock', sector: 'Technology',     price:  194.85, change:   2.40, changePercent:  1.25, volume:  12_841_700, marketCap:   912_000_000_000 },
  { symbol: 'ORCL',  name: 'Oracle Corp.',            category: 'stock', sector: 'Technology',     price:  172.30, change:   0.95, changePercent:  0.55, volume:  11_432_800, marketCap:   472_000_000_000 },
  { symbol: 'CRM',   name: 'Salesforce Inc.',         category: 'stock', sector: 'Technology',     price:  342.15, change:   3.45, changePercent:  1.02, volume:   7_842_100, marketCap:   330_000_000_000 },
  { symbol: 'ADBE',  name: 'Adobe Inc.',              category: 'stock', sector: 'Technology',     price:  471.50, change:  -2.80, changePercent: -0.59, volume:   6_241_800, marketCap:   211_000_000_000 },
  { symbol: 'NOW',   name: 'ServiceNow Inc.',         category: 'stock', sector: 'Technology',     price:  918.25, change:   8.15, changePercent:  0.89, volume:   2_841_200, marketCap:   188_000_000_000 },
  { symbol: 'CSCO',  name: 'Cisco Systems Inc.',      category: 'stock', sector: 'Technology',     price:   57.82, change:   0.45, changePercent:  0.78, volume:  24_113_200, marketCap:   231_000_000_000 },
  { symbol: 'IBM',   name: 'IBM Corp.',               category: 'stock', sector: 'Technology',     price:  214.60, change:  -1.15, changePercent: -0.53, volume:   5_432_700, marketCap:   196_000_000_000 },
  { symbol: 'ARM',   name: 'Arm Holdings plc',        category: 'stock', sector: 'Technology',     price:  147.60, change:   3.85, changePercent:  2.68, volume:   7_321_400, marketCap:   157_000_000_000 },
  { symbol: 'PLTR',  name: 'Palantir Technologies',   category: 'stock', sector: 'Technology',     price:   38.45, change:   1.22, changePercent:  3.28, volume:  42_813_600, marketCap:    83_000_000_000 },
  { symbol: 'CRWD',  name: 'CrowdStrike Holdings',    category: 'stock', sector: 'Technology',     price:  381.20, change:   5.45, changePercent:  1.45, volume:   5_132_900, marketCap:    92_000_000_000 },
  { symbol: 'PANW',  name: 'Palo Alto Networks',      category: 'stock', sector: 'Technology',     price:  386.40, change:  -1.80, changePercent: -0.46, volume:   4_218_700, marketCap:   125_000_000_000 },
  { symbol: 'SNOW',  name: 'Snowflake Inc.',          category: 'stock', sector: 'Technology',     price:  147.30, change:   2.85, changePercent:  1.97, volume:   8_214_300, marketCap:    49_000_000_000 },
  { symbol: 'DDOG',  name: 'Datadog Inc.',            category: 'stock', sector: 'Technology',     price:  122.80, change:   1.45, changePercent:  1.19, volume:   4_832_100, marketCap:    38_000_000_000 },
  { symbol: 'NET',   name: 'Cloudflare Inc.',         category: 'stock', sector: 'Technology',     price:  111.45, change:   0.85, changePercent:  0.77, volume:   6_421_800, marketCap:    37_000_000_000 },
  { symbol: 'SHOP',  name: 'Shopify Inc.',            category: 'stock', sector: 'Technology',     price:   97.85, change:   1.35, changePercent:  1.40, volume:  11_842_300, marketCap:   126_000_000_000 },
  { symbol: 'ZM',    name: 'Zoom Video Comm.',        category: 'stock', sector: 'Technology',     price:   82.15, change:  -0.45, changePercent: -0.55, volume:   5_841_200, marketCap:    25_000_000_000 },

  // ── COMMUNICATIONS ──────────────────────────────────────────────────────────
  { symbol: 'GOOGL', name: 'Alphabet Inc.',           category: 'stock', sector: 'Communications', price:  198.42, change:   1.07, changePercent:  0.54, volume:  27_311_400, marketCap: 2_450_000_000_000 },
  { symbol: 'META',  name: 'Meta Platforms Inc.',     category: 'stock', sector: 'Communications', price:  612.45, change:  -2.88, changePercent: -0.47, volume:  14_881_900, marketCap: 1_540_000_000_000 },
  { symbol: 'NFLX',  name: 'Netflix Inc.',            category: 'stock', sector: 'Communications', price:  891.20, change:  12.45, changePercent:  1.42, volume:   4_812_300, marketCap:   381_000_000_000 },
  { symbol: 'T',     name: 'AT&T Inc.',               category: 'stock', sector: 'Communications', price:   22.15, change:   0.15, changePercent:  0.68, volume:  38_421_700, marketCap:   158_000_000_000 },
  { symbol: 'VZ',    name: 'Verizon Comm.',           category: 'stock', sector: 'Communications', price:   42.35, change:  -0.25, changePercent: -0.59, volume:  22_841_300, marketCap:   178_000_000_000 },
  { symbol: 'SNAP',  name: 'Snap Inc.',               category: 'stock', sector: 'Communications', price:   11.45, change:   0.45, changePercent:  4.10, volume:  24_812_300, marketCap:    19_000_000_000 },
  { symbol: 'PINS',  name: 'Pinterest Inc.',          category: 'stock', sector: 'Communications', price:   28.30, change:   0.75, changePercent:  2.72, volume:  12_421_800, marketCap:    19_000_000_000 },
  { symbol: 'SPOT',  name: 'Spotify Technology',      category: 'stock', sector: 'Communications', price:  398.45, change:   5.85, changePercent:  1.49, volume:   3_812_100, marketCap:    77_000_000_000 },

  // ── CONSUMER ────────────────────────────────────────────────────────────────
  { symbol: 'TSLA',  name: 'Tesla Inc.',              category: 'stock', sector: 'Consumer',       price:  278.93, change:  -5.32, changePercent: -1.87, volume:  91_842_100, marketCap:   888_000_000_000 },
  { symbol: 'AMZN',  name: 'Amazon.com Inc.',         category: 'stock', sector: 'Consumer',       price:  226.83, change:   4.21, changePercent:  1.89, volume:  38_022_200, marketCap: 2_380_000_000_000 },
  { symbol: 'WMT',   name: 'Walmart Inc.',            category: 'stock', sector: 'Consumer',       price:   92.45, change:   0.48, changePercent:  0.52, volume:  14_821_300, marketCap:   745_000_000_000 },
  { symbol: 'TGT',   name: 'Target Corp.',            category: 'stock', sector: 'Consumer',       price:  145.80, change:  -1.20, changePercent: -0.82, volume:   6_412_800, marketCap:    67_000_000_000 },
  { symbol: 'COST',  name: 'Costco Wholesale',        category: 'stock', sector: 'Consumer',       price:  918.30, change:   7.45, changePercent:  0.82, volume:   2_941_800, marketCap:   407_000_000_000 },
  { symbol: 'HD',    name: 'Home Depot Inc.',         category: 'stock', sector: 'Consumer',       price:  405.75, change:   2.85, changePercent:  0.71, volume:   4_812_700, marketCap:   402_000_000_000 },
  { symbol: 'NKE',   name: 'Nike Inc.',               category: 'stock', sector: 'Consumer',       price:   78.45, change:  -0.85, changePercent: -1.07, volume:   8_421_300, marketCap:   117_000_000_000 },
  { symbol: 'SBUX',  name: 'Starbucks Corp.',         category: 'stock', sector: 'Consumer',       price:   98.20, change:   1.15, changePercent:  1.18, volume:   7_841_200, marketCap:   111_000_000_000 },
  { symbol: 'MCD',   name: "McDonald's Corp.",        category: 'stock', sector: 'Consumer',       price:  305.60, change:   1.85, changePercent:  0.61, volume:   3_812_100, marketCap:   220_000_000_000 },
  { symbol: 'DIS',   name: 'Walt Disney Co.',         category: 'stock', sector: 'Consumer',       price:  112.35, change:  -0.65, changePercent: -0.58, volume:   8_212_400, marketCap:   205_000_000_000 },
  { symbol: 'UBER',  name: 'Uber Technologies',       category: 'stock', sector: 'Consumer',       price:   82.15, change:   1.45, changePercent:  1.80, volume:  12_841_700, marketCap:   174_000_000_000 },
  { symbol: 'RBLX',  name: 'Roblox Corp.',            category: 'stock', sector: 'Consumer',       price:   38.45, change:   0.85, changePercent:  2.26, volume:   9_412_300, marketCap:    25_000_000_000 },
  { symbol: 'ABNB',  name: 'Airbnb Inc.',             category: 'stock', sector: 'Consumer',       price:  148.30, change:   2.45, changePercent:  1.68, volume:   6_821_400, marketCap:    95_000_000_000 },

  // ── FINANCE ─────────────────────────────────────────────────────────────────
  { symbol: 'JPM',   name: 'JPMorgan Chase & Co.',    category: 'stock', sector: 'Finance',        price:  248.30, change:   2.15, changePercent:  0.87, volume:  10_821_400, marketCap:   715_000_000_000 },
  { symbol: 'BAC',   name: 'Bank of America Corp.',   category: 'stock', sector: 'Finance',        price:   47.20, change:   0.42, changePercent:  0.90, volume:  28_412_800, marketCap:   363_000_000_000 },
  { symbol: 'V',     name: 'Visa Inc.',               category: 'stock', sector: 'Finance',        price:  305.80, change:   2.45, changePercent:  0.81, volume:   7_221_300, marketCap:   627_000_000_000 },
  { symbol: 'MA',    name: 'Mastercard Inc.',         category: 'stock', sector: 'Finance',        price:  519.45, change:   4.20, changePercent:  0.81, volume:   4_812_100, marketCap:   480_000_000_000 },
  { symbol: 'GS',    name: 'Goldman Sachs Group',     category: 'stock', sector: 'Finance',        price:  591.25, change:   5.80, changePercent:  0.99, volume:   2_841_700, marketCap:   194_000_000_000 },
  { symbol: 'WFC',   name: 'Wells Fargo & Co.',       category: 'stock', sector: 'Finance',        price:   79.15, change:   0.65, changePercent:  0.83, volume:  14_212_300, marketCap:   268_000_000_000 },
  { symbol: 'MS',    name: 'Morgan Stanley',          category: 'stock', sector: 'Finance',        price:  133.80, change:   1.25, changePercent:  0.94, volume:   6_821_400, marketCap:   223_000_000_000 },
  { symbol: 'BLK',   name: 'BlackRock Inc.',          category: 'stock', sector: 'Finance',        price: 1044.60, change:   8.45, changePercent:  0.82, volume:   1_841_200, marketCap:   160_000_000_000 },
  { symbol: 'AXP',   name: 'American Express Co.',    category: 'stock', sector: 'Finance',        price:  292.10, change:   2.85, changePercent:  0.99, volume:   4_512_800, marketCap:   210_000_000_000 },
  { symbol: 'PYPL',  name: 'PayPal Holdings Inc.',    category: 'stock', sector: 'Finance',        price:   82.35, change:  -0.85, changePercent: -1.02, volume:  12_841_500, marketCap:    84_000_000_000 },
  { symbol: 'COIN',  name: 'Coinbase Global Inc.',    category: 'stock', sector: 'Finance',        price:  247.80, change:   8.45, changePercent:  3.53, volume:   8_412_300, marketCap:    62_000_000_000 },
  { symbol: 'BRKB',  name: 'Berkshire Hathaway B',    category: 'stock', sector: 'Finance',        price:  481.20, change:   1.85, changePercent:  0.39, volume:   3_421_800, marketCap:   684_000_000_000 },
  { symbol: 'SQ',    name: 'Block Inc.',              category: 'stock', sector: 'Finance',        price:   68.45, change:   1.85, changePercent:  2.78, volume:   9_412_300, marketCap:    42_000_000_000 },

  // ── HEALTHCARE ──────────────────────────────────────────────────────────────
  { symbol: 'JNJ',   name: 'Johnson & Johnson',       category: 'stock', sector: 'Healthcare',     price:  158.45, change:   0.85, changePercent:  0.54, volume:   8_421_300, marketCap:   382_000_000_000 },
  { symbol: 'UNH',   name: 'UnitedHealth Group',      category: 'stock', sector: 'Healthcare',     price:  589.30, change:  -3.45, changePercent: -0.58, volume:   3_812_100, marketCap:   543_000_000_000 },
  { symbol: 'LLY',   name: 'Eli Lilly and Co.',       category: 'stock', sector: 'Healthcare',     price:  881.50, change:  12.45, changePercent:  1.43, volume:   2_841_700, marketCap:   838_000_000_000 },
  { symbol: 'ABBV',  name: 'AbbVie Inc.',             category: 'stock', sector: 'Healthcare',     price:  194.60, change:   1.45, changePercent:  0.75, volume:   6_421_300, marketCap:   343_000_000_000 },
  { symbol: 'PFE',   name: 'Pfizer Inc.',             category: 'stock', sector: 'Healthcare',     price:   28.35, change:  -0.25, changePercent: -0.87, volume:  21_412_800, marketCap:   161_000_000_000 },
  { symbol: 'MRK',   name: 'Merck & Co. Inc.',        category: 'stock', sector: 'Healthcare',     price:  125.40, change:   0.85, changePercent:  0.68, volume:   8_841_200, marketCap:   317_000_000_000 },
  { symbol: 'BMY',   name: 'Bristol-Myers Squibb',    category: 'stock', sector: 'Healthcare',     price:   56.20, change:  -0.35, changePercent: -0.62, volume:  11_412_300, marketCap:   111_000_000_000 },
  { symbol: 'AMGN',  name: 'Amgen Inc.',              category: 'stock', sector: 'Healthcare',     price:  315.80, change:   2.45, changePercent:  0.78, volume:   4_821_300, marketCap:   170_000_000_000 },
  { symbol: 'GILD',  name: 'Gilead Sciences Inc.',    category: 'stock', sector: 'Healthcare',     price:   97.45, change:   0.65, changePercent:  0.67, volume:   7_841_200, marketCap:   122_000_000_000 },

  // ── ENERGY ──────────────────────────────────────────────────────────────────
  { symbol: 'XOM',   name: 'Exxon Mobil Corp.',       category: 'stock', sector: 'Energy',         price:  118.25, change:   0.85, changePercent:  0.72, volume:  16_841_300, marketCap:   473_000_000_000 },
  { symbol: 'CVX',   name: 'Chevron Corp.',           category: 'stock', sector: 'Energy',         price:  148.60, change:  -0.85, changePercent: -0.57, volume:  10_421_800, marketCap:   267_000_000_000 },
  { symbol: 'COP',   name: 'ConocoPhillips',          category: 'stock', sector: 'Energy',         price:  114.85, change:   1.25, changePercent:  1.10, volume:   8_412_300, marketCap:   142_000_000_000 },
  { symbol: 'SLB',   name: 'SLB (Schlumberger)',      category: 'stock', sector: 'Energy',         price:   45.90, change:  -0.45, changePercent: -0.97, volume:  12_841_700, marketCap:    65_000_000_000 },

  // ── INDUSTRIALS ─────────────────────────────────────────────────────────────
  { symbol: 'BA',    name: 'Boeing Co.',              category: 'stock', sector: 'Industrials',    price:  182.45, change:   2.85, changePercent:  1.59, volume:   7_421_300, marketCap:   111_000_000_000 },
  { symbol: 'CAT',   name: 'Caterpillar Inc.',        category: 'stock', sector: 'Industrials',    price:  378.20, change:   3.45, changePercent:  0.92, volume:   3_812_100, marketCap:   191_000_000_000 },
  { symbol: 'GE',    name: 'GE Aerospace',            category: 'stock', sector: 'Industrials',    price:  180.15, change:   1.45, changePercent:  0.81, volume:   5_841_200, marketCap:   195_000_000_000 },
  { symbol: 'LMT',   name: 'Lockheed Martin Corp.',   category: 'stock', sector: 'Industrials',    price:  547.80, change:  -1.85, changePercent: -0.34, volume:   1_841_300, marketCap:   132_000_000_000 },
  { symbol: 'RTX',   name: 'RTX Corp.',               category: 'stock', sector: 'Industrials',    price:  128.45, change:   0.95, changePercent:  0.75, volume:   4_821_300, marketCap:   170_000_000_000 },
  { symbol: 'HON',   name: 'Honeywell International', category: 'stock', sector: 'Industrials',    price:  218.30, change:   1.25, changePercent:  0.58, volume:   3_412_100, marketCap:   138_000_000_000 },

  // ── CRYPTO ──────────────────────────────────────────────────────────────────
  { symbol: 'BTC-USD',   name: 'Bitcoin',     category: 'crypto', price:  97_842.10, change:  1_842.30,  changePercent:  1.92, volume: 38_412_000_000 },
  { symbol: 'ETH-USD',   name: 'Ethereum',    category: 'crypto', price:   3_412.66, change:    -41.20,  changePercent: -1.19, volume: 14_882_000_000 },
  { symbol: 'SOL-USD',   name: 'Solana',      category: 'crypto', price:     185.45, change:      8.25,  changePercent:  4.66, volume:  4_821_000_000 },
  { symbol: 'BNB-USD',   name: 'BNB',         category: 'crypto', price:     612.30, change:      5.45,  changePercent:  0.90, volume:  2_841_000_000 },
  { symbol: 'XRP-USD',   name: 'XRP',         category: 'crypto', price:       2.45, change:      0.12,  changePercent:  5.15, volume:  8_412_000_000 },
  { symbol: 'DOGE-USD',  name: 'Dogecoin',    category: 'crypto', price:       0.380, change:     0.021, changePercent:  5.85, volume:  4_841_000_000 },
  { symbol: 'ADA-USD',   name: 'Cardano',     category: 'crypto', price:       0.920, change:     0.038, changePercent:  4.31, volume:  2_841_000_000 },
  { symbol: 'AVAX-USD',  name: 'Avalanche',   category: 'crypto', price:      38.45,  change:     1.85,  changePercent:  5.06, volume:  1_841_000_000 },
  { symbol: 'DOT-USD',   name: 'Polkadot',    category: 'crypto', price:       8.25,  change:     0.35,  changePercent:  4.43, volume:    841_000_000 },
  { symbol: 'MATIC-USD', name: 'Polygon',     category: 'crypto', price:       0.850, change:     0.042, changePercent:  5.20, volume:  1_841_000_000 },
  { symbol: 'LINK-USD',  name: 'Chainlink',   category: 'crypto', price:      18.45,  change:     0.85,  changePercent:  4.83, volume:    641_000_000 },
  { symbol: 'LTC-USD',   name: 'Litecoin',    category: 'crypto', price:     108.30,  change:     2.45,  changePercent:  2.31, volume:    541_000_000 },
  { symbol: 'SHIB-USD',  name: 'Shiba Inu',   category: 'crypto', price:   0.0000245, change: 0.0000012, changePercent:  5.15, volume:  2_841_000_000 },
  { symbol: 'TRX-USD',   name: 'TRON',        category: 'crypto', price:       0.245, change:     0.012, changePercent:  5.15, volume:  1_841_000_000 },

  // ── ETFs ────────────────────────────────────────────────────────────────────
  { symbol: 'SPY',   name: 'SPDR S&P 500 ETF',        category: 'etf', price: 598.74, change:  1.93, changePercent:  0.32, volume: 42_811_200 },
  { symbol: 'QQQ',   name: 'Invesco QQQ Trust',        category: 'etf', price: 514.30, change:  3.85, changePercent:  0.75, volume: 34_821_300 },
  { symbol: 'IWM',   name: 'iShares Russell 2000 ETF', category: 'etf', price: 218.45, change: -0.85, changePercent: -0.39, volume: 18_412_100 },
  { symbol: 'GLD',   name: 'SPDR Gold Shares',         category: 'etf', price: 245.80, change:  1.45, changePercent:  0.59, volume:  8_421_300 },
  { symbol: 'SLV',   name: 'iShares Silver Trust',     category: 'etf', price:  31.45, change:  0.25, changePercent:  0.80, volume:  7_841_200 },
  { symbol: 'VTI',   name: 'Vanguard Total Market',    category: 'etf', price: 280.20, change:  1.15, changePercent:  0.41, volume:  6_821_400 },
  { symbol: 'VOO',   name: 'Vanguard S&P 500 ETF',     category: 'etf', price: 548.90, change:  2.15, changePercent:  0.39, volume:  5_841_300 },
  { symbol: 'ARKK',  name: 'ARK Innovation ETF',       category: 'etf', price:  52.35, change: -0.85, changePercent: -1.60, volume: 12_841_200 },
  { symbol: 'XLK',   name: 'Technology Select SPDR',   category: 'etf', price: 248.20, change:  2.45, changePercent:  0.99, volume:  7_421_300 },
  { symbol: 'XLF',   name: 'Financial Select SPDR',    category: 'etf', price:  49.80, change:  0.35, changePercent:  0.71, volume: 14_841_700 },
  { symbol: 'XLE',   name: 'Energy Select SPDR',       category: 'etf', price:  91.25, change: -0.45, changePercent: -0.49, volume:  9_421_300 },
  { symbol: 'XLV',   name: 'Health Care Select SPDR',  category: 'etf', price: 148.30, change:  0.85, changePercent:  0.58, volume:  6_841_200 },
  { symbol: 'TLT',   name: 'iShares 20+ Year Treasury',category: 'etf', price:  95.45, change: -0.35, changePercent: -0.37, volume:  8_421_700 },
  { symbol: 'AGG',   name: 'iShares Core U.S. Agg. Bond', category: 'etf', price: 98.20, change: -0.15, changePercent: -0.15, volume: 4_821_300 },
  { symbol: 'EFA',   name: 'iShares MSCI EAFE ETF',    category: 'etf', price:  79.35, change:  0.45, changePercent:  0.57, volume:  7_841_200 },
  { symbol: 'IEMG',  name: 'iShares MSCI Emerging Markets', category: 'etf', price: 58.45, change: 0.35, changePercent: 0.60, volume: 8_421_300 },
];

@Injectable({ providedIn: 'root' })
export class MarketDataService {
  private readonly finnhub = inject(FinnhubService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // finnhub symbol → app symbol (for WebSocket reverse lookup)
  private readonly finnhubToApp = new Map<string, string>();

  // app symbol → previous close (for computing change on live ticks)
  private readonly prevClose = new Map<string, number>(
    SEED_ASSETS.map(a => [a.symbol, a.price - a.change]),
  );

  private readonly _assets = signal<Asset[]>(
    SEED_ASSETS.map((a, i) => ({
      ...a,
      sparklineData: buildSparkline(a.price, a.changePercent, (i + 1) * 137),
    })),
  );

  readonly assets = this._assets.asReadonly();

  readonly topGainers = computed(() =>
    [...this._assets()]
      .filter(a => a.category === 'stock' || a.category === 'crypto')
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5),
  );

  readonly topLosers = computed(() =>
    [...this._assets()]
      .filter(a => a.category === 'stock' || a.category === 'crypto')
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5),
  );

  readonly mostActive = computed(() =>
    [...this._assets()]
      .filter(a => a.category === 'stock')
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5),
  );

  constructor() {
    for (const a of SEED_ASSETS) {
      this.finnhubToApp.set(this.finnhub.toFinnhubSymbol(a.symbol), a.symbol);
    }

    if (this.isBrowser && this.finnhub.isConfigured) {
      // Phase 1: load quotes (prices + OHLC-improved synthetic sparklines)
      // Phase 2: load real candle data to replace synthetic sparklines with actual price history
      this.loadInitialPricesBatched()
        .then(() => this.loadSparklinesBatched())
        .catch(e => console.error('[market] background load error:', e));
      this.connectRealtime();
    }
  }

  /**
   * Phase 1 — Batch-load live quotes (10 per batch, 12 s between batches).
   * Stays safely under Finnhub's free-tier 60 calls/minute limit.
   * When a quote arrives its OHLC data is used to build a realistic synthetic
   * sparkline that replaces the pure-seed-noise version.
   */
  private async loadInitialPricesBatched(): Promise<void> {
    const BATCH_SIZE    = 10;
    const BATCH_DELAY   = 12_000; // ms — 10 calls/12 s = 50 calls/min ✓
    const symbols = SEED_ASSETS.map(a => a.symbol);

    for (let start = 0; start < symbols.length; start += BATCH_SIZE) {
      if (start > 0) {
        await new Promise<void>(r => setTimeout(r, BATCH_DELAY));
      }

      const batch = symbols.slice(start, start + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(symbol =>
          this.finnhub.fetchQuote(symbol).then(q => ({ symbol, q })),
        ),
      );

      const quotes = new Map<string, FinnhubQuote>();
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value.q) {
          quotes.set(r.value.symbol, r.value.q);
        }
      }

      if (quotes.size > 0) {
        this._assets.update(assets =>
          assets.map((asset, i) => {
            const q = quotes.get(asset.symbol);
            if (!q) return asset;
            this.prevClose.set(asset.symbol, q.pc);
            return {
              ...asset,
              price:         q.c,
              change:        q.d,
              changePercent: q.dp,
              // Use real OHLC anchors to build a much more realistic
              // synthetic sparkline — replaced again in Phase 2 with real candles.
              sparklineData: buildSparklineFromOHLC(q.pc, q.o, q.h, q.l, q.c, (i + 1) * 137),
            };
          }),
        );
      }
    }
  }

  /**
   * Phase 2 — Load real hourly candle data (48 h window) for every asset.
   * Runs AFTER Phase 1 completes to avoid double-counting against the rate limit.
   * When candles arrive, only sparklineData is updated (price stays from the quote).
   * Batch: 10 assets / 15 s = 40 calls/min ✓
   */
  private async loadSparklinesBatched(): Promise<void> {
    const BATCH_SIZE  = 10;
    const BATCH_DELAY = 15_000; // ms — slightly more conservative than Phase 1
    const now  = Math.floor(Date.now() / 1000);
    const from = now - 48 * 3600; // 48-hour lookback for hourly candles

    for (let start = 0; start < SEED_ASSETS.length; start += BATCH_SIZE) {
      if (start > 0) {
        await new Promise<void>(r => setTimeout(r, BATCH_DELAY));
      }

      const batch = SEED_ASSETS.slice(start, start + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(a =>
          this.finnhub.fetchCandles(
            a.symbol,
            a.category === 'crypto',
            '60',  // 1-hour resolution → ~48 data points for crypto, ~14 for stocks
            from,
            now,
          ).then(candles => ({ symbol: a.symbol, candles })),
        ),
      );

      const updates = new Map<string, number[]>();
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value.candles?.length) {
          updates.set(r.value.symbol, r.value.candles);
        }
      }

      if (updates.size > 0) {
        this._assets.update(assets =>
          assets.map(a => {
            const candles = updates.get(a.symbol);
            if (!candles) return a;
            // Real candle closes — the sparkline now shows actual price history.
            return { ...a, sparklineData: candles };
          }),
        );
      }
    }
  }

  /** Subscribe to real-time WebSocket ticks for the most liquid symbols only. */
  private connectRealtime(): void {
    for (const sym of REALTIME_SYMBOLS) {
      this.finnhubToApp.set(this.finnhub.toFinnhubSymbol(sym), sym);
    }

    this.finnhub.connectWebSocket(REALTIME_SYMBOLS, (finnhubSym, newPrice) => {
      const appSymbol = this.finnhubToApp.get(finnhubSym);
      if (!appSymbol) return;

      this._assets.update(assets =>
        assets.map(a => {
          if (a.symbol !== appSymbol) return a;
          const pc = this.prevClose.get(appSymbol) ?? a.price;
          const change = newPrice - pc;
          const changePercent = pc > 0 ? (change / pc) * 100 : 0;
          return {
            ...a,
            price: +newPrice.toFixed(8),
            change: +change.toFixed(8),
            changePercent: +changePercent.toFixed(2),
          };
        }),
      );
    });
  }

  getBySymbol(symbol: string): Asset | undefined {
    return this._assets().find(a => a.symbol === symbol.toUpperCase());
  }

  getPrice(symbol: string): number {
    return this.getBySymbol(symbol)?.price ?? 0;
  }
}
