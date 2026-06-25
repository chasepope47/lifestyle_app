-- Nutrition goals and food entry log

CREATE TABLE nutrition_goals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  household_id  UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  calories_goal INTEGER,
  protein_g     INTEGER,
  carbs_g       INTEGER,
  fat_g         INTEGER,
  fiber_g       INTEGER,
  water_ml      INTEGER,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE food_entries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  entry_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type    TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name    TEXT NOT NULL,
  brand        TEXT,
  serving_size NUMERIC,
  serving_unit TEXT,
  calories     NUMERIC(8,2) NOT NULL,
  protein_g    NUMERIC(8,2),
  carbs_g      NUMERIC(8,2),
  fat_g        NUMERIC(8,2),
  fiber_g      NUMERIC(8,2),
  sodium_mg    NUMERIC(8,2),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;

-- Each user owns their own goals
CREATE POLICY "nutrition_goals_own" ON nutrition_goals FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Household can read all food logs (partner support); only owner can write/delete
CREATE POLICY "food_entries_household_read" ON food_entries FOR SELECT
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
CREATE POLICY "food_entries_own_insert" ON food_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "food_entries_own_update" ON food_entries FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "food_entries_own_delete" ON food_entries FOR DELETE
  USING (user_id = auth.uid());
