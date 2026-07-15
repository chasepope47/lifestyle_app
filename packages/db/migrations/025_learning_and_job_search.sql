-- Learning domain: cybersecurity study tracking, certs, CTFs, and job search

CREATE TABLE study_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  topic        TEXT NOT NULL,
  resource     TEXT,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at     TIMESTAMPTZ,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    CASE WHEN ended_at IS NOT NULL
      THEN (EXTRACT(EPOCH FROM (ended_at - started_at)))::INTEGER / 60
      ELSE NULL
    END
  ) STORED,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE certs_goals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'planned'
               CHECK (status IN ('planned', 'in_progress', 'scheduled', 'passed', 'failed')),
  progress_pct INTEGER NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  target_date  DATE,
  exam_date    DATE,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ctf_progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  event_name   TEXT NOT NULL,
  challenge_name TEXT,
  category     TEXT,
  solved       BOOLEAN NOT NULL DEFAULT false,
  points       INTEGER,
  writeup_url  TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes        TEXT
);

CREATE TABLE skills_tracked (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  category     TEXT,
  proficiency  TEXT NOT NULL DEFAULT 'learning'
               CHECK (proficiency IN ('learning', 'familiar', 'proficient', 'expert')),
  notes        TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

CREATE TABLE job_leads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  company      TEXT NOT NULL,
  role_title   TEXT NOT NULL,
  url          TEXT,
  source       TEXT,
  match_score  INTEGER CHECK (match_score BETWEEN 0 AND 100),
  tags         TEXT[],
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE job_applications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  lead_id      UUID REFERENCES job_leads(id) ON DELETE SET NULL,
  company      TEXT NOT NULL,
  role_title   TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'saved'
               CHECK (status IN ('saved', 'applied', 'phone_screen', 'interviewing', 'offer', 'rejected', 'withdrawn')),
  applied_at   DATE,
  next_action  TEXT,
  next_action_date DATE,
  url          TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE certs_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ctf_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills_tracked ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "study_sessions_own_write" ON study_sessions FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "study_sessions_household_read" ON study_sessions FOR SELECT
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));

CREATE POLICY "certs_goals_own_write" ON certs_goals FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "certs_goals_household_read" ON certs_goals FOR SELECT
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));

CREATE POLICY "ctf_progress_own_write" ON ctf_progress FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "ctf_progress_household_read" ON ctf_progress FOR SELECT
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));

CREATE POLICY "skills_tracked_own_write" ON skills_tracked FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "skills_tracked_household_read" ON skills_tracked FOR SELECT
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));

CREATE POLICY "job_leads_own_write" ON job_leads FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "job_leads_household_read" ON job_leads FOR SELECT
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));

CREATE POLICY "job_applications_own_write" ON job_applications FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "job_applications_household_read" ON job_applications FOR SELECT
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
