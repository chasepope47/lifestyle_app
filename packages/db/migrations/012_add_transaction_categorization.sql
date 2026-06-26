-- Add transaction categorization and emotion tracking
ALTER TABLE transactions
ADD COLUMN category TEXT CHECK (category IN ('needs', 'wants', 'savings') OR category IS NULL),
ADD COLUMN emotion TEXT CHECK (emotion IN ('happy', 'neutral', 'sad') OR emotion IS NULL);
