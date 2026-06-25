-- Workouts: exercise library, sessions, sets, and health metrics

CREATE TABLE exercises (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,  -- NULL = global built-in
  name         TEXT NOT NULL,
  muscle_group TEXT,
  equipment    TEXT,
  notes        TEXT,
  is_custom    BOOLEAN NOT NULL DEFAULT false,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workout_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id     UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at         TIMESTAMPTZ,
  title            TEXT,
  notes            TEXT,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    CASE WHEN ended_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (ended_at - started_at))::INTEGER / 60
    END
  ) STORED
);

CREATE TABLE session_exercises (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  set_number  INTEGER NOT NULL,
  reps        INTEGER,
  weight_kg   NUMERIC(6,2),
  duration_s  INTEGER,
  distance_m  NUMERIC(8,2),
  notes       TEXT
);

CREATE TABLE health_metrics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id    UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  source          TEXT NOT NULL CHECK (source IN ('garmin', 'bevel', 'manual')),
  metric_date     DATE NOT NULL,
  steps           INTEGER,
  calories_burned INTEGER,
  active_minutes  INTEGER,
  heart_rate_avg  INTEGER,
  sleep_hours     NUMERIC(4,1),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, source, metric_date)
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;

-- Exercises: global (household_id IS NULL) or household-custom
CREATE POLICY "exercises_read" ON exercises FOR SELECT
  USING (
    household_id IS NULL
    OR household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  );
CREATE POLICY "exercises_custom_write" ON exercises FOR INSERT
  WITH CHECK (is_custom = true AND household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
CREATE POLICY "exercises_custom_delete" ON exercises FOR DELETE
  USING (created_by = auth.uid());

-- Sessions: household can read (accountability); only owner writes
CREATE POLICY "sessions_household_read" ON workout_sessions FOR SELECT
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
CREATE POLICY "sessions_own_insert" ON workout_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "sessions_own_update" ON workout_sessions FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "sessions_own_delete" ON workout_sessions FOR DELETE
  USING (user_id = auth.uid());

-- Session exercises: accessible if you can read the session
CREATE POLICY "session_ex_read" ON session_exercises FOR SELECT
  USING (session_id IN (SELECT id FROM workout_sessions WHERE household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  )));
CREATE POLICY "session_ex_write" ON session_exercises FOR INSERT
  WITH CHECK (session_id IN (SELECT id FROM workout_sessions WHERE user_id = auth.uid()));
CREATE POLICY "session_ex_delete" ON session_exercises FOR DELETE
  USING (session_id IN (SELECT id FROM workout_sessions WHERE user_id = auth.uid()));

-- Health metrics: own write; household read
CREATE POLICY "health_metrics_household_read" ON health_metrics FOR SELECT
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
CREATE POLICY "health_metrics_own_write" ON health_metrics FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "health_metrics_own_update" ON health_metrics FOR UPDATE
  USING (user_id = auth.uid());

-- Seed global exercise library
INSERT INTO exercises (name, muscle_group, equipment, is_custom) VALUES
  ('Barbell Squat', 'Quads', 'Barbell', false),
  ('Deadlift', 'Back', 'Barbell', false),
  ('Bench Press', 'Chest', 'Barbell', false),
  ('Pull-Up', 'Back', 'Bodyweight', false),
  ('Overhead Press', 'Shoulders', 'Barbell', false),
  ('Romanian Deadlift', 'Hamstrings', 'Barbell', false),
  ('Dumbbell Curl', 'Biceps', 'Dumbbell', false),
  ('Tricep Pushdown', 'Triceps', 'Cable', false),
  ('Plank', 'Core', 'Bodyweight', false),
  ('Running', 'Cardio', 'Treadmill', false),
  ('Cycling', 'Cardio', 'Bike', false),
  ('Rowing', 'Full Body', 'Rower', false),
  ('Lat Pulldown', 'Back', 'Machine', false),
  ('Leg Press', 'Quads', 'Machine', false),
  ('Hip Thrust', 'Glutes', 'Barbell', false);
