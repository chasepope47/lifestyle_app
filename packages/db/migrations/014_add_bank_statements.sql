-- Add bank statements table for storing uploaded statements
CREATE TABLE bank_statements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   UUID NOT NULL REFERENCES budget_accounts(id) ON DELETE CASCADE,
  file_name    TEXT NOT NULL,
  file_path    TEXT NOT NULL,
  statement_month DATE NOT NULL,
  uploaded_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_size    BIGINT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add columns to budget_accounts for future Plaid integration
ALTER TABLE budget_accounts
ADD COLUMN plaid_item_id TEXT,
ADD COLUMN plaid_account_id TEXT,
ADD COLUMN last_synced_at TIMESTAMPTZ;

-- Enable RLS
ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bank_statements_household" ON bank_statements FOR ALL
  USING (account_id IN (SELECT id FROM budget_accounts WHERE household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  )))
  WITH CHECK (account_id IN (SELECT id FROM budget_accounts WHERE household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  )));
