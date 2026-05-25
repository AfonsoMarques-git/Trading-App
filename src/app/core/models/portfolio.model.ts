export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT';
export type OrderStatus = 'FILLED' | 'PENDING' | 'CANCELLED' | 'REJECTED';

export interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

export interface Trade {
  id: string;
  timestamp: Date;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price: number;
  total: number;
  status: OrderStatus;
}

export interface PortfolioSummary {
  cashBalance: number;
  holdingsValue: number;
  totalValue: number;
  dailyPnL: number;
  dailyPnLPercent: number;
  totalPnL: number;
  totalPnLPercent: number;
  winRate: number;
  totalTrades: number;
}
