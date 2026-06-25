-- Religious studies: devotional plans, prayer requests, scripture notes, app shortcuts

CREATE TABLE devotional_plans (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  created_by   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  total_days   INTEGER NOT NULL,
  start_date   DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE devotional_progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id      UUID NOT NULL REFERENCES devotional_plans(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number   INTEGER NOT NULL,
  completed_at TIMESTAMPTZ,
  notes        TEXT,
  UNIQUE (plan_id, user_id, day_number)
);

CREATE TABLE prayer_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  body         TEXT,
  is_answered  BOOLEAN NOT NULL DEFAULT false,
  answered_at  TIMESTAMPTZ,
  is_private   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE scripture_notes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  reference    TEXT NOT NULL,
  translation  TEXT DEFAULT 'NIV',
  body         TEXT,
  tags         TEXT[],
  is_private   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE app_shortcuts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label        TEXT NOT NULL,
  url          TEXT NOT NULL,
  icon         TEXT,
  module       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE devotional_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE devotional_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripture_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_shortcuts ENABLE ROW LEVEL SECURITY;

-- Devotional plans: shared with household; creator can delete
CREATE POLICY "devotional_plans_household" ON devotional_plans FOR SELECT
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
CREATE POLICY "devotional_plans_insert" ON devotional_plans FOR INSERT
  WITH CHECK (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
CREATE POLICY "devotional_plans_delete" ON devotional_plans FOR DELETE
  USING (created_by = auth.uid());

-- Progress: own write; household read
CREATE POLICY "devotional_progress_household_read" ON devotional_progress FOR SELECT
  USING (plan_id IN (
    SELECT id FROM devotional_plans
    WHERE household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  ));
CREATE POLICY "devotional_progress_own_write" ON devotional_progress FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Prayer requests: author always sees; partner sees non-private
CREATE POLICY "prayer_read" ON prayer_requests FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      is_private = false
      AND household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
    )
  );
CREATE POLICY "prayer_own_write" ON prayer_requests FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Scripture notes: author always sees; partner sees non-private
CREATE POLICY "scripture_read" ON scripture_notes FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      is_private = false
      AND household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
    )
  );
CREATE POLICY "scripture_own_write" ON scripture_notes FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- App shortcuts: household visible
CREATE POLICY "shortcuts_household" ON app_shortcuts FOR ALL
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()))
  WITH CHECK (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));

-- Seed default Gospel Library shortcut (will be attached to household on creation via app logic)
