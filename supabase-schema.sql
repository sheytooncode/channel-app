-- ============================================================
-- CHANNEL APP — Supabase Schema
-- Run this entire file in: Supabase → SQL Editor → New query
-- ============================================================

-- Goals: each user has up to 3 goals that anchor their week
CREATE TABLE IF NOT EXISTS goals (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label      TEXT        NOT NULL,
  short      TEXT        NOT NULL,
  color      TEXT        NOT NULL DEFAULT '#00C2FF',
  position   INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks: weekly tasks tied to a goal and a day
CREATE TABLE IF NOT EXISTS tasks (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id          UUID        REFERENCES goals(id) ON DELETE SET NULL,
  title            TEXT        NOT NULL,
  mins             INTEGER     NOT NULL DEFAULT 30,
  done             BOOLEAN     NOT NULL DEFAULT FALSE,
  priority         TEXT        NOT NULL DEFAULT 'normal', -- 'high' | 'normal'
  week_start       DATE        NOT NULL,                  -- Monday of the relevant week
  day_index        INTEGER     NOT NULL DEFAULT 0,
  carry_onunt      INTEGER     NOT NULL DEFAULT 0,
  subtasks         JSONB       NOT NULL DEFAULT '[]',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goals: own rows only" ON goals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "tasks: own rows only" ON tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURL�NEV; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE8 FUMCTION set_updated_at();
