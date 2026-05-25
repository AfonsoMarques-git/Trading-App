export type AssetCategory = 'stock' | 'crypto' | 'etf';

export interface Asset {
  symbol: string;
  name: string;
  category: AssetCategory;
  /** Sector classification — stocks only (e.g. 'Technology', 'Finance') */
  sector?: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  sparklineData: number[];
}
