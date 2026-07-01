-- Add income-tracker flag to budget_categories.
-- When is_income = true, the monthly_limit becomes an income target and the
-- category tracks positive-amount transactions (received) instead of negative ones (spent).
ALTER TABLE budget_categories ADD COLUMN IF NOT EXISTS is_income BOOLEAN NOT NULL DEFAULT false;
