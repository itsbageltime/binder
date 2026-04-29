-- Binder auth migration
-- Run in Supabase SQL editor: https://supabase.com/dashboard/project/nbiwbvqbtyqvuzaklvcx/sql
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. profiles
CREATE TABLE IF NOT EXISTS profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  created_at timestamptz DEFAULT now(),
  channels text[]
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own profile insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own profile update" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- 2. user_signals
CREATE TABLE IF NOT EXISTS user_signals (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_url text NOT NULL,
  signal_type text NOT NULL,
  channel text,
  source text,
  author text,
  dwell_seconds numeric,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE user_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own signals" ON user_signals FOR ALL USING (auth.uid() = user_id);

-- 3. user_likes
CREATE TABLE IF NOT EXISTS user_likes (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, card_url)
);
ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own likes" ON user_likes FOR ALL USING (auth.uid() = user_id);

-- 4. user_sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  cards_seen int DEFAULT 0,
  cards_completed int DEFAULT 0,
  expands int DEFAULT 0,
  article_clicks int DEFAULT 0,
  likes int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
);
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sessions" ON user_sessions FOR ALL USING (auth.uid() = user_id);

-- 5. feed_surveys
CREATE TABLE IF NOT EXISTS feed_surveys (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  response text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
);
ALTER TABLE feed_surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own surveys" ON feed_surveys FOR ALL USING (auth.uid() = user_id);

-- 6. followed_journalists — add user_id
-- WARNING: clears existing rows (they have no user_id and can't be migrated)
TRUNCATE followed_journalists;
ALTER TABLE followed_journalists ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE followed_journalists ALTER COLUMN user_id SET NOT NULL;
-- Drop old PK (name, publication) and replace with (user_id, name, publication)
ALTER TABLE followed_journalists DROP CONSTRAINT IF EXISTS followed_journalists_pkey;
ALTER TABLE followed_journalists ADD PRIMARY KEY (user_id, name, publication);
ALTER TABLE followed_journalists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow all" ON followed_journalists;
CREATE POLICY "own journalist follows" ON followed_journalists FOR ALL USING (auth.uid() = user_id);

-- 7. followed_publications — add user_id
TRUNCATE followed_publications;
ALTER TABLE followed_publications ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE followed_publications ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE followed_publications DROP CONSTRAINT IF EXISTS followed_publications_pkey;
ALTER TABLE followed_publications ADD PRIMARY KEY (user_id, name);
ALTER TABLE followed_publications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow all" ON followed_publications;
CREATE POLICY "own publication follows" ON followed_publications FOR ALL USING (auth.uid() = user_id);

-- 8. Update CLAUDE.md schema notes separately — not SQL
