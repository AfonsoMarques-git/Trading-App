-- =============================================================
-- PaperTrade Pro — Demo User Seed Data
--
-- BEFORE running this file:
--   1. Create the demo user in Supabase Dashboard:
--      Authentication → Users → Add user
--      Email:    demo@papertrade.pro
--      Password: Demo1234!
--      (tick "Auto Confirm User")
--   2. Copy the UUID that Supabase assigns the user.
--   3. Replace EVERY occurrence of
--      '00000000-0000-0000-0000-000000000000'
--      below with that real UUID.
--   4. Run this file in: SQL Editor → New query
-- =============================================================

DO $$
DECLARE
  uid UUID := '85bd6652-548c-4227-9e81-506415b7d951'; -- ← replace this
BEGIN

-- ── profile ───────────────────────────────────────────────────
INSERT INTO public.profiles (id, display_name, cash_balance)
VALUES (uid, 'Demo Trader', 73212.55)
ON CONFLICT (id) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      cash_balance = EXCLUDED.cash_balance;

-- ── open positions ────────────────────────────────────────────
INSERT INTO public.positions (user_id, symbol, quantity, average_price) VALUES
  (uid, 'AAPL',    25,   218.40),
  (uid, 'NVDA',    80,   132.10),
  (uid, 'MSFT',    10,   421.55),
  (uid, 'BTC-USD', 0.12, 92140.00),
  (uid, 'SPY',     15,   588.32)
ON CONFLICT (user_id, symbol) DO UPDATE
  SET quantity = EXCLUDED.quantity, average_price = EXCLUDED.average_price;

-- ── trade history ─────────────────────────────────────────────
INSERT INTO public.trades (id, user_id, executed_at, symbol, side, order_type, quantity, price, total, status) VALUES
  ('t-1009', uid, NOW() - INTERVAL '1.5 hours',  'NVDA',    'BUY',  'MARKET', 30,   142.18,   4265.40, 'FILLED'),
  ('t-1008', uid, NOW() - INTERVAL '6 hours',    'TSLA',    'SELL', 'LIMIT',  12,   282.40,   3388.80, 'FILLED'),
  ('t-1007', uid, NOW() - INTERVAL '22 hours',   'AAPL',    'BUY',  'MARKET', 10,   231.07,   2310.70, 'FILLED'),
  ('t-1006', uid, NOW() - INTERVAL '30 hours',   'BTC-USD', 'BUY',  'LIMIT',  0.05, 95881.10, 4794.06, 'FILLED'),
  ('t-1005', uid, NOW() - INTERVAL '48 hours',   'SPY',     'BUY',  'MARKET', 15,   588.32,   8824.80, 'FILLED'),
  ('t-1004', uid, NOW() - INTERVAL '72 hours',   'META',    'SELL', 'MARKET', 5,    618.10,   3090.50, 'FILLED'),
  ('t-1003', uid, NOW() - INTERVAL '96 hours',   'GOOGL',   'BUY',  'LIMIT',  20,   195.00,   3900.00, 'CANCELLED')
ON CONFLICT (id) DO NOTHING;

-- ── watchlist ─────────────────────────────────────────────────
INSERT INTO public.watchlist (user_id, symbol) VALUES
  (uid, 'AAPL'),
  (uid, 'NVDA'),
  (uid, 'TSLA'),
  (uid, 'MSFT'),
  (uid, 'ETH-USD')
ON CONFLICT (user_id, symbol) DO NOTHING;

-- ── price alerts ──────────────────────────────────────────────
INSERT INTO public.price_alerts (id, user_id, symbol, condition, target_price, active, created_at) VALUES
  ('a-001', uid, 'AAPL',    'above', 240,     true,  NOW() - INTERVAL '2 days'),
  ('a-002', uid, 'NVDA',    'below', 120,     true,  NOW() - INTERVAL '1 day'),
  ('a-003', uid, 'BTC-USD', 'above', 100000,  true,  NOW() - INTERVAL '3 days'),
  ('a-004', uid, 'TSLA',    'below', 250,     false, NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- ── notifications ─────────────────────────────────────────────
INSERT INTO public.notifications (id, user_id, type, title, body, read, created_at) VALUES
  ('n-001', uid, 'order',  'Order filled',          'BUY 30 × NVDA @ $142.18 filled successfully.',            false, NOW() - INTERVAL '90 minutes'),
  ('n-002', uid, 'order',  'Order filled',          'SELL 12 × TSLA @ $282.40 filled successfully.',           false, NOW() - INTERVAL '6 hours'),
  ('n-003', uid, 'alert',  'Price alert triggered', 'TSLA dropped below your $250 target.',                    false, NOW() - INTERVAL '12 hours'),
  ('n-004', uid, 'risk',   'Risk warning',          'Your BTC-USD position exceeds 15% of portfolio value.',   true,  NOW() - INTERVAL '1 day'),
  ('n-005', uid, 'order',  'Order cancelled',       'LIMIT BUY 20 × GOOGL @ $195.00 was cancelled.',          true,  NOW() - INTERVAL '2 days'),
  ('n-006', uid, 'system', 'Welcome to PaperTrade', 'Your demo account is ready. You have $100,000 to trade.', true,  NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- ── user settings ─────────────────────────────────────────────
INSERT INTO public.user_settings (user_id, trading_defaults, notification_prefs, appearance)
VALUES (
  uid,
  '{"orderType":"MARKET","defaultQuantity":10,"maxPositionSize":5000,"stopLossPercent":2}',
  '{"orderExecution":true,"priceAlerts":true,"riskWarnings":true,"dailySummary":false}',
  '{"accentColor":"#6366f1","compactMode":false,"animations":true}'
)
ON CONFLICT (user_id) DO UPDATE
  SET trading_defaults   = EXCLUDED.trading_defaults,
      notification_prefs = EXCLUDED.notification_prefs,
      appearance         = EXCLUDED.appearance;

END $$;
