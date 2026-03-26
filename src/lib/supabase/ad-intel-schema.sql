-- ============================================================
-- VidRevamp — Ad Intelligence Extension Schema
-- Run this after the base schema.sql
-- ============================================================

-- ============================================================
-- PLATFORM ENUM EXTENSION (add META / FACEBOOK)
-- ============================================================
-- If you need META/FACEBOOK in the platform_type enum, run:
-- ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'META';
-- ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'FACEBOOK';
-- We use TEXT below to avoid enum migration complexity.

-- ============================================================
-- COMPETITORS (tracked brands)
-- ============================================================
CREATE TABLE IF NOT EXISTS competitors (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  platform            TEXT NOT NULL DEFAULT 'META',  -- 'META' | 'TIKTOK' | 'YOUTUBE'
  external_url        TEXT,
  est_monthly_spend   FLOAT NOT NULL DEFAULT 0.0,
  alerts_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
  last_scraped_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name, platform)
);

-- ============================================================
-- AD CREATIVES (individual ads per competitor)
-- ============================================================
CREATE TABLE IF NOT EXISTS ad_creatives (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_id     UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  external_ad_id    TEXT NOT NULL UNIQUE,   -- Prevents duplicate ingestion
  platform          TEXT NOT NULL,          -- 'META' | 'TIKTOK' | 'YOUTUBE'
  video_url         TEXT NOT NULL DEFAULT '',
  thumbnail_url     TEXT,
  transcript        TEXT,
  ad_copy           TEXT,                   -- Caption / body text
  call_to_action    TEXT,
  landing_url       TEXT,
  status            TEXT NOT NULL DEFAULT 'ACTIVE',  -- 'ACTIVE' | 'INACTIVE'
  days_active       INT NOT NULL DEFAULT 1,
  engagement_data   JSONB DEFAULT '{}'::jsonb,  -- { views, likes, shares, comments }
  discovered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SWIPE FILE FOLDERS (user collections of saved ads)
-- ============================================================
CREATE TABLE IF NOT EXISTS swipe_folders (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'Uncategorized',
  color       TEXT DEFAULT '#6366f1',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);

-- ============================================================
-- SWIPE FILE SAVES (ads bookmarked into folders)
-- ============================================================
CREATE TABLE IF NOT EXISTS swipe_saves (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ad_id       UUID NOT NULL REFERENCES ad_creatives(id) ON DELETE CASCADE,
  folder_id   UUID REFERENCES swipe_folders(id) ON DELETE SET NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, ad_id)
);

-- ============================================================
-- GENERATED AD SCRIPTS (AI "Model & Clone" output)
-- ============================================================
CREATE TABLE IF NOT EXISTS generated_ad_scripts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_ad_id    UUID REFERENCES ad_creatives(id) ON DELETE SET NULL,
  product_name    TEXT NOT NULL,
  target_audience TEXT,
  usps            TEXT[],                    -- Up to 3 unique selling props
  script          TEXT NOT NULL,
  model_used      TEXT,
  tokens_used     INT DEFAULT 0,
  cost_usd        FLOAT DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- API USAGE LOGS (cost tracking per provider)
-- ============================================================
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  provider      TEXT NOT NULL,    -- 'SCRAPE_CREATORS' | 'OPENAI' | 'YOUTUBE_API'
  endpoint      TEXT NOT NULL,    -- e.g. 'fb_ad_library' or 'gpt-4o'
  units_used    INT NOT NULL DEFAULT 0,
  cost_usd      FLOAT NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'SUCCESS',  -- 'SUCCESS' | 'FAILED'
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_competitors_user ON competitors(user_id);
CREATE INDEX IF NOT EXISTS idx_competitors_alerts ON competitors(alerts_enabled) WHERE alerts_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_ad_creatives_competitor ON ad_creatives(competitor_id);
CREATE INDEX IF NOT EXISTS idx_ad_creatives_platform ON ad_creatives(platform);
CREATE INDEX IF NOT EXISTS idx_ad_creatives_status ON ad_creatives(status);
CREATE INDEX IF NOT EXISTS idx_swipe_saves_user ON swipe_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_gen_scripts_user ON generated_ad_scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_provider ON api_usage_logs(provider);
CREATE INDEX IF NOT EXISTS idx_api_logs_created ON api_usage_logs(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipe_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipe_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_ad_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "competitors_own_data" ON competitors FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "swipe_folders_own_data" ON swipe_folders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "swipe_saves_own_data" ON swipe_saves FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "gen_scripts_own_data" ON generated_ad_scripts FOR ALL USING (auth.uid() = user_id);

-- Ad creatives: visible if you track the competitor
CREATE POLICY "ad_creatives_via_competitor" ON ad_creatives FOR ALL
  USING (
    competitor_id IN (SELECT id FROM competitors WHERE user_id = auth.uid())
  );

-- API logs: users see their own; admins see all (check role in users table)
CREATE POLICY "api_logs_own_data" ON api_usage_logs FOR ALL
  USING (user_id = auth.uid() OR user_id IS NULL);
