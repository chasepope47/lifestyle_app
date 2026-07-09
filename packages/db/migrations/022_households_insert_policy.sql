-- households has RLS enabled (migration 001) but was never given an INSERT
-- policy — with RLS enabled and zero policies for an operation, it's denied
-- by default. This has always made both the auto-create-personal-household
-- flow (HouseholdProvider) and the manual "Create household" flow
-- (household/setup) fail with a 403 for every new user.
--
-- If the SQL Editor gives "must be owner of table", use the Supabase Table
-- Editor instead: Dashboard → Authentication → Policies → households →
-- New Policy → INSERT → WITH CHECK: owner_id = auth.uid()
CREATE POLICY "owner_insert_household"
  ON public.households FOR INSERT
  WITH CHECK (owner_id = auth.uid());
