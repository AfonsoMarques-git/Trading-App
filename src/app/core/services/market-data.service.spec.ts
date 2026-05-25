import { TestBed } from '@angular/core/testing';
import { MarketDataService } from './market-data.service';
import { FinnhubService } from './finnhub.service';

const mockFinnhub = {
  isConfigured: false,
  toFinnhubSymbol: (s: string) => s,
  fetchQuote: async () => null,
  connectWebSocket: () => {},
  disconnect: () => {},
};

describe('MarketDataService', () => {
  let service: MarketDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MarketDataService,
        { provide: FinnhubService, useValue: mockFinnhub },
      ],
    });
    service = TestBed.inject(MarketDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return a non-empty asset list', () => {
    expect(service.assets().length).toBeGreaterThan(0);
  });

  it('should find AAPL by symbol', () => {
    const asset = service.getBySymbol('AAPL');
    expect(asset).toBeTruthy();
    expect(asset?.symbol).toBe('AAPL');
    expect(asset?.price).toBeGreaterThan(0);
  });

  it('should return undefined for unknown symbol', () => {
    expect(service.getBySymbol('FAKE999')).toBeUndefined();
  });

  it('should return top gainers sorted descending', () => {
    const gainers = service.topGainers();
    expect(gainers.length).toBeGreaterThan(0);
    for (let i = 1; i < gainers.length; i++) {
      expect(gainers[i - 1].changePercent).toBeGreaterThanOrEqual(gainers[i].changePercent);
    }
  });

  it('should return top losers sorted ascending', () => {
    const losers = service.topLosers();
    expect(losers.length).toBeGreaterThan(0);
    for (let i = 1; i < losers.length; i++) {
      expect(losers[i - 1].changePercent).toBeLessThanOrEqual(losers[i].changePercent);
    }
  });

  it('every asset should have a sparkline with 20 points', () => {
    for (const asset of service.assets()) {
      expect(asset.sparklineData.length).toBe(20);
    }
  });
});
