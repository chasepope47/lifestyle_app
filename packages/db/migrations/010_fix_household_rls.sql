-- Fix household_members RLS policies to resolve circular subquery issue
-- This prevents 500 errors when querying household members

DROP POLICY IF EXISTS "members_read_membership" ON household_members;
DROP POLICY IF EXISTS "members_insert_membership" ON household_members;

CREATE POLICY "members_read_membership"
  ON household_members FOR SELECT
  USING (true);

CREATE POLICY "members_insert_membership"
  ON household_members FOR INSERT
  WITH CHECK (user_id = auth.uid());
