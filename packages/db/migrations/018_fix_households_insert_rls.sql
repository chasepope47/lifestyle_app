-- Allow authenticated users to create a household where they are the owner.
-- The original migration (001) defined SELECT/UPDATE/DELETE policies on households
-- but omitted an INSERT policy, causing RLS to block new users during setup.

CREATE POLICY "owner_insert_household"
  ON households FOR INSERT
  WITH CHECK (owner_id = auth.uid());
