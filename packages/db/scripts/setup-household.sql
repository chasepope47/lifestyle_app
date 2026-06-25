-- ============================================================
-- Step 1 of 2: Create household in the NEW Supabase project
-- ============================================================
-- Run this FIRST, before migrate-data.sql
--
-- Prerequisites:
--   1. Both Chase and Bre must have signed up at the new project URL
--   2. Get their new UUIDs from: Dashboard → Authentication → Users
--   3. Fill in the two IDs below and run
-- ============================================================

DO $setup$
DECLARE
  chase_id UUID := '83d96329-f1ea-4820-b0fc-798e1b799d1b';
  bre_id   UUID := 'f3b494af-9b39-4fd7-9698-02d2e9319fe1';
  new_hh   UUID := gen_random_uuid();
BEGIN
  IF chase_id::TEXT = 'PASTE-CHASE-UUID-FROM-AUTH-USERS' THEN
    RAISE EXCEPTION 'Fill in chase_id first';
  END IF;
  IF bre_id::TEXT = 'PASTE-BRE-UUID-FROM-AUTH-USERS' THEN
    RAISE EXCEPTION 'Fill in bre_id first';
  END IF;

  INSERT INTO households (id, name, invite_code, invite_expires_at, owner_id)
  VALUES (new_hh, 'Pope Household', 'POPE01', NOW() + INTERVAL '30 days', chase_id);

  INSERT INTO household_members (household_id, user_id, role, display_name)
  VALUES
    (new_hh, chase_id, 'owner', 'Chase'),
    (new_hh, bre_id,   'member', 'Bre');

  RAISE NOTICE '===========================================';
  RAISE NOTICE 'HOUSEHOLD ID: %', new_hh;
  RAISE NOTICE 'Copy this into migrate-data.sql as hh_id';
  RAISE NOTICE '===========================================';
END;
$setup$;
