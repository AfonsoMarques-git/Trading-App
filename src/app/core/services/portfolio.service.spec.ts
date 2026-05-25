import { TestBed } from '@angular/core/testing';
import { PortfolioService } from './portfolio.service';
import { MarketDataService } from './market-data.service';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

const mockSupabase = {
  client: {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }),
      insert: async () => ({ error: null }),
      update: () => ({ eq: () => ({ eq: async () => ({}) }) }),
      upsert: async () => ({ error: null }),
      delete: () => ({ eq: () => ({ eq: async () => ({}) }) }),
    }),
  },
};

const mockAuth = {
  user: () => null,
  isAuthenticated: () => false,
  waitForReady: async () => {},
};

describe('PortfolioService', () => {
  let service: PortfolioService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PortfolioService,
        MarketDataService,
        { provide: AuthService, useValue: mockAuth },
        { provide: SupabaseService, useValue: mockSupabase },
      ],
    });
    service = TestBed.inject(PortfolioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty state', () => {
    expect(service.trades()).toEqual([]);
    expect(service.holdings()).toEqual([]);
    expect(service.cashBalance()).toBe(0);
  });

  it('should return zero summary when no data', () => {
    const s = service.summary();
    expect(s.totalTrades).toBe(0);
    expect(s.totalValue).toBe(0);
  });

  it('should reject order for unknown symbol', () => {
    const result = service.submitOrder({ symbol: 'FAKE999', side: 'BUY', type: 'MARKET', quantity: 1 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('Unknown symbol');
  });

  it('should reject order with zero quantity', () => {
    const result = service.submitOrder({ symbol: 'AAPL', side: 'BUY', type: 'MARKET', quantity: 0 });
    expect(result.ok).toBe(false);
  });

  it('should reject buy when insufficient cash', () => {
    // cashBalance starts at 0
    const result = service.submitOrder({ symbol: 'AAPL', side: 'BUY', type: 'MARKET', quantity: 1 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('Insufficient cash');
  });
});
