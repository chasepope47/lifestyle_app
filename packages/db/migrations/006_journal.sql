-- Journal entries with per-entry privacy toggle

CREATE TABLE journal_entries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  title      TEXT,
  body       TEXT NOT NULL,
  mood       TEXT CHECK (mood IN ('great', 'good', 'okay', 'low', 'bad')),
  tags       TEXT[],
  is_private BOOLEAN NOT NULL DEFAULT false,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Author always sees their own entries.
-- Partner sees non-private entries only.
CREATE POLICY "journal_read" ON journal_entries FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      is_private = false
      AND household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "journal_own_insert" ON journal_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "journal_own_update" ON journal_entries FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "journal_own_delete" ON journal_entries FOR DELETE
  USING (user_id = auth.uid());

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_journal_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_journal_timestamp();
