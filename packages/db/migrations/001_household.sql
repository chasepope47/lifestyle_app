-- Household and member management
-- Ported from popepantry with minor extensions

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE households (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  invite_code      TEXT UNIQUE NOT NULL,
  invite_expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  owner_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE household_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  display_name TEXT,
  avatar_url   TEXT,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (household_id, user_id)
);

-- RLS
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_read_household"
  ON households FOR SELECT
  USING (id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "owner_update_household"
  ON households FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "owner_delete_household"
  ON households FOR DELETE
  USING (owner_id = auth.uid());

CREATE POLICY "members_read_membership"
  ON household_members FOR SELECT
  USING (true);

CREATE POLICY "members_insert_membership"
  ON household_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "member_update_own_profile"
  ON household_members FOR UPDATE
  USING (user_id = auth.uid());

-- Join household via invite code; returns new household_id
CREATE OR REPLACE FUNCTION join_household(p_invite_code TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_household_id UUID;
BEGIN
  SELECT id INTO v_household_id
  FROM households
  WHERE invite_code = upper(p_invite_code)
    AND invite_expires_at > now();

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;

  INSERT INTO household_members (household_id, user_id, role)
  VALUES (v_household_id, auth.uid(), 'member')
  ON CONFLICT DO NOTHING;

  RETURN v_household_id;
END;
$$;
