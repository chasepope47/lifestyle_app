-- Budget goals: savings targets, spending limits, debt payoff tracking

CREATE TABLE budget_goals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id   UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  category_id    UUID REFERENCES budget_categories(id) ON DELETE SET NULL,
  name           TEXT NOT NULL,
  goal_type      TEXT NOT NULL CHECK (goal_type IN ('savings', 'spending_limit', 'debt_payoff')),
  target_amount  NUMERIC(12,2) NOT NULL,
  current_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  target_date    DATE,
  notes          TEXT,
  created_by     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  achieved_at    TIMESTAMPTZ
);

ALTER TABLE budget_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_goals_household" ON budget_goals FOR ALL
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()))
  WITH CHECK (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
