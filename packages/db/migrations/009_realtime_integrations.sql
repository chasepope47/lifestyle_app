-- Realtime + integration tokens + activity feed

-- Enable Supabase Realtime on collaborative tables
ALTER PUBLICATION supabase_realtime ADD TABLE pantry_items;
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_suggestions;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE meal_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE prayer_requests;

-- Integration tokens (Garmin, Bevel, Canvas)
CREATE TABLE integration_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL CHECK (provider IN ('garmin', 'bevel', 'canvas')),
  access_token  TEXT NOT NULL,
  refresh_token TEXT,
  expires_at    TIMESTAMPTZ,
  scope         TEXT,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

ALTER TABLE integration_tokens ENABLE ROW LEVEL SECURITY;

-- Only the owning user can see or modify their tokens
CREATE POLICY "tokens_own" ON integration_tokens FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Activity feed: lightweight event log for dashboard partner stream
CREATE TABLE activity_feed (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module       TEXT NOT NULL,
  action       TEXT NOT NULL,
  payload      JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_household_read" ON activity_feed FOR SELECT
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
CREATE POLICY "activity_own_insert" ON activity_feed FOR INSERT
  WITH CHECK (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE activity_feed;

-- Auto-expire activity feed entries older than 30 days (keeps table lean)
CREATE OR REPLACE FUNCTION cleanup_old_activity()
RETURNS void LANGUAGE sql AS $$
  DELETE FROM activity_feed WHERE created_at < now() - INTERVAL '30 days';
$$;
