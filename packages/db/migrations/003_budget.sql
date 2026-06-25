-- Budget: accounts, categories, transactions

CREATE TABLE budget_accounts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit', 'cash', 'investment')),
  balance      NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency     TEXT NOT NULL DEFAULT 'USD',
  is_shared    BOOLEAN NOT NULL DEFAULT true,
  created_by   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE budget_categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  monthly_limit NUMERIC(10,2),
  color         TEXT,
  icon          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id     UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  account_id       UUID NOT NULL REFERENCES budget_accounts(id) ON DELETE CASCADE,
  category_id      UUID REFERENCES budget_categories(id) ON DELETE SET NULL,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount           NUMERIC(12,2) NOT NULL,  -- negative = expense, positive = income
  description      TEXT NOT NULL,
  merchant         TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring     BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule  TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: all household members see and can write all budget data
ALTER TABLE budget_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_accounts_household" ON budget_accounts FOR ALL
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()))
  WITH CHECK (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));

CREATE POLICY "budget_categories_household" ON budget_categories FOR ALL
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()))
  WITH CHECK (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));

CREATE POLICY "transactions_household" ON transactions FOR ALL
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()))
  WITH CHECK (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
