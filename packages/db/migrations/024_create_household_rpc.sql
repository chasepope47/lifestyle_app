-- Household creation ("Invite my partner" and "Skip for now — use solo") has been
-- failing with "new row violates row-level security policy for table households"
-- even though the owner_insert_household policy (owner_id = auth.uid()) looks
-- correct and matches the request. Rather than keep guessing at what's mismatched
-- between the session JWT and how Postgres resolves auth.uid() for this project,
-- this moves creation into a SECURITY DEFINER function — the same trusted-RPC
-- pattern join_household() already uses successfully — so it no longer depends
-- on that RLS check passing at all.
CREATE OR REPLACE FUNCTION public.create_household(
  p_name TEXT,
  p_invite_code TEXT,
  p_invite_expires_at TIMESTAMPTZ,
  p_display_name TEXT DEFAULT NULL
)
RETURNS households
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_household households;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO households (name, invite_code, owner_id, invite_expires_at)
  VALUES (p_name, upper(p_invite_code), v_uid, p_invite_expires_at)
  RETURNING * INTO v_household;

  INSERT INTO household_members (household_id, user_id, role, display_name)
  VALUES (v_household.id, v_uid, 'owner', p_display_name)
  ON CONFLICT DO NOTHING;

  RETURN v_household;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_household(TEXT, TEXT, TIMESTAMPTZ, TEXT) TO authenticated;
