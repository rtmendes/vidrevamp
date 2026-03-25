-- ============================================================
-- VidRevamp -- Full PostgreSQL Schema for Supabase
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_tier AS ENUM ('FREE', 'PRO', 'AGENCY');
CREATE TYPE platform_type AS ENUM ('YOUTUBE', 'TIKTOK', 'INSTAGRAM');
CREATE TYPE vault_item_type AS ENUM ('HOOK', 'STYLE');
CREATE TYPE saved_item_type AS ENUM ('VIDEO', 'SCRIPT');

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email              TEXT NOT NULL UNIQUE,
  full_name          TEXT,
  avatar_url         TEXT,
  tier               user_tier NOT NULL DEFAULT 'FREE',
  credits_remaining  INT NOT NULL DEFAULT 10,
  stripe_customer_id TEXT,
  legacy_mode        BOOLEAN NOT NULL DEFAULT FALSE,
  default_keywords   TEXT[] DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WATCHLISTS
-- ============================================================
CREATE TABLE watchlists (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRACKED CHANNELS
-- ============================================================
CREATE TABLE tracked_channels (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform      platform_type NOT NULL,
  handle        TEXT NOT NULL,
  display_name  TEXT,
  avatar_url    TEXT,
  average_views INT NOT NULL DEFAULT 0,
  subscriber_count INT DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (platform, handle)
);

-- ============================================================
-- WATCHLIST <> CHANNEL JOIN TABLE
-- ============================================================
CREATE TABLE watchlist_channels (
  watchlist_id UUID NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
  channel_id   UUID NOT NULL REFERENCES tracked_channels(id) ON DELETE CASCADE,
  added_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (watchlist_id, channel_id)
);

-- ============================================================
-- VIDEO INSIGHTS
-- transcript JSONB format: [{"t": "00:00", "text": "..."}]
-- visual_analysis JSONB format: {
--   "visual_hook": "...",
--   "pacing_cuts_per_sec": 2.5,
--   "broll_usage": "...",
--   "text_overlay_style": "...",
--   "camera_framing": "...",
--   "screenshots": ["url1", "url2"]
-- }
-- ============================================================
CREATE TABLE video_insights (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id       UUID NOT NULL REFERENCES tracked_channels(id) ON DELETE CASCADE,
  url              TEXT NOT NULL UNIQUE,
  title            TEXT,
  thumbnail_url    TEXT,
  views            INT NOT NULL DEFAULT 0,
  likes            INT DEFAULT 0,
  comments         INT DEFAULT 0,
  duration_seconds INT DEFAULT 0,
  outlier_score    FLOAT NOT NULL DEFAULT 0.0,
  transcript       JSONB DEFAULT '[]'::jsonb,
  visual_analysis  JSONB DEFAULT '{}'::jsonb,
  published_at     TIMESTAMPTZ,
  analyzed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VAULT ITEMS
-- ============================================================
CREATE TABLE vault_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            vault_item_type NOT NULL,
  content         TEXT NOT NULL,
  tags            TEXT[] DEFAULT '{}',
  source_video_id UUID REFERENCES video_insights(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE projects (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SAVED ITEMS (videos or generated scripts saved to projects)
-- ============================================================
CREATE TABLE saved_items (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_type  saved_item_type NOT NULL,
  item_id    UUID NOT NULL,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, item_type, item_id)
);

-- ============================================================
-- GENERATED SCRIPTS (stores AI-generated blueprints)
-- ============================================================
CREATE TABLE generated_scripts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject          TEXT NOT NULL,
  angle            TEXT NOT NULL,
  blueprint        TEXT NOT NULL,
  language         TEXT NOT NULL DEFAULT 'English',
  vault_items_used UUID[] DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_watchlists_user_id ON watchlists(user_id);
CREATE INDEX idx_watchlist_channels_watchlist ON watchlist_channels(watchlist_id);
CREATE INDEX idx_video_insights_channel ON video_insights(channel_id);
CREATE INDEX idx_video_insights_outlier ON video_insights(outlier_score DESC);
CREATE INDEX idx_vault_items_user ON vault_items(user_id);
CREATE INDEX idx_vault_items_type ON vault_items(type);
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_saved_items_project ON saved_items(project_id);
CREATE INDEX idx_generated_scripts_user ON generated_scripts(user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_scripts ENABLE ROW LEVEL SECURITY;

-- Users can only see/edit their own data
CREATE POLICY "users_own_data" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "watchlists_own_data" ON watchlists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "vault_items_own_data" ON vault_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "projects_own_data" ON projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "scripts_own_data" ON generated_scripts FOR ALL USING (auth.uid() = user_id);

-- Saved items: accessible if you own the project
CREATE POLICY "saved_items_via_project" ON saved_items FOR ALL
  USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );
