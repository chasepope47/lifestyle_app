-- Add income-tracker flag to budget_categories.
-- When is_income = true, the monthly_limit becomes an income target and the
-- category tracks positive-amount transactions (received) instead of negative ones (spent).
--
-- If the SQL Editor gives "must be owner of table", use the Supabase Table Editor instead:
--   Dashboard → Database → Tables → budget_categories → Columns → Add column
--   Name: is_income  |  Type: bool  |  Default: false  |  Is Nullable: off
ALTER TABLE public.budget_categories
  ADD COLUMN IF NOT EXISTS is_income BOOLEAN NOT NULL DEFAULT false;
