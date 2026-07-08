-- Add recipe details to meal_plans so a planned meal can show a full recipe
-- (ingredients + instructions), not just a name and short notes.
--
-- If the SQL Editor gives "must be owner of table", use the Supabase Table Editor instead:
--   Dashboard → Database → Tables → meal_plans → Columns → Add column
--   ingredients: Type text[], Is Nullable: on
--   instructions: Type text, Is Nullable: on
ALTER TABLE public.meal_plans
  ADD COLUMN IF NOT EXISTS ingredients TEXT[],
  ADD COLUMN IF NOT EXISTS instructions TEXT;
