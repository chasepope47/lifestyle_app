-- School classes and assignments (Canvas sync support)

CREATE TABLE school_classes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  instructor   TEXT,
  color        TEXT,
  semester     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE assignments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  class_id     UUID REFERENCES school_classes(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  due_date     TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'todo'
               CHECK (status IN ('todo', 'in_progress', 'submitted', 'graded')),
  grade        NUMERIC(5,2),
  grade_scale  TEXT DEFAULT '100',
  weight_pct   NUMERIC(5,2),
  notes        TEXT,
  provider     TEXT NOT NULL DEFAULT 'manual' CHECK (provider IN ('manual', 'canvas')),
  external_id  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider, external_id)
);

ALTER TABLE school_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Classes: own write; household read (partner sees your courses)
CREATE POLICY "classes_own_write" ON school_classes FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "classes_household_read" ON school_classes FOR SELECT
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));

-- Assignments: own write; household read
CREATE POLICY "assignments_own_write" ON assignments FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "assignments_household_read" ON assignments FOR SELECT
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
