-- Add transfers as a valid transaction category
ALTER TABLE transactions
DROP CONSTRAINT transactions_category_check;

ALTER TABLE transactions
ADD CONSTRAINT transactions_category_check CHECK (category IN ('needs', 'wants', 'savings', 'transfers') OR category IS NULL);
