-- =============================================================
-- PaperTrade Pro — Supabase Schema
-- Run this entire file in: Supabase Dashboard > SQL Editor > New query
-- =============================================================

-- ── 1. PROFILES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT        NOT NULL DEFAULT 'Trader',
  cash_balance  NUMERIC(15,2) NOT NULL DEFAULT 100000.00,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. POSITIONS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.positions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol        TEXT        NOT NULL,
  quantity      NUMERIC(15,6) NOT NULL,
  average_price NUMERIC(15,4) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

-- ── 3. TRADES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trades (
  id          TEXT        PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  symbol      TEXT        NOT NULL,
  side        TEXT        NOT NULL CHECK (side IN ('BUY','SELL')),
  order_type  TEXT        NOT NULL CHECK (order_type IN ('MARKET','LIMIT')),
  quantity    NUMERIC(15,6) NOT NULL,
  price       NUMERIC(15,4) NOT NULL,
  total       NUMERIC(15,2) NOT NULL,
  status      TEXT        NOT NULL CHECK (status IN ('FILLED','PENDING','CANCELLED','REJECTED')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. WATCHLIST ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.watchlist (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

-- ── 5. PRICE ALERTS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id           TEXT PRIMARY KEY,
  user_id      UUID  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol       TEXT  NOT NULL,
  condition    TEXT  NOT NULL CHECK (condition IN ('above','below')),
  target_price NUMERIC(15,4) NOT NULL,
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  triggered_at TIMESTAMPTZ
);

-- ── 6. NOTIFICATIONS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         TEXT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('order','alert','risk','system')),
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 7. USER SETTINGS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  trading_defaults   JSONB NOT NULL DEFAULT '{"orderType":"MARKET","defaultQuantity":10,"maxPositionSize":5000,"stopLossPercent":2}',
  notification_prefs JSONB NOT NULL DEFAULT '{"orderExecution":true,"priceAlerts":true,"riskWarnings":true,"dailySummary":false}',
  appearance         JSONB NOT NULL DEFAULT '{"accentColor":"#6366f1","compactMode":false,"animations":true}',
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- ROW-LEVEL SECURITY
-- =============================================================

ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles: own row" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- positions
CREATE POLICY "positions: own rows" ON public.positions
  FOR ALL USING (auth.uid() = user_id);

-- trades
CREATE POLICY "trades: own rows" ON public.trades
  FOR ALL USING (auth.uid() = user_id);

-- watchlist
CREATE POLICY "watchlist: own rows" ON public.watchlist
  FOR ALL USING (auth.uid() = user_id);

-- price_alerts
CREATE POLICY "price_alerts: own rows" ON public.price_alerts
  FOR ALL USING (auth.uid() = user_id);

-- notifications
CREATE POLICY "notifications: own rows" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- user_settings
CREATE POLICY "user_settings: own row" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================
-- TRIGGER: auto-create profile + settings on signup
-- =============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  display TEXT;
BEGIN
  display := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, display_name, cash_balance)
  VALUES (NEW.id, display, 100000.00)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
