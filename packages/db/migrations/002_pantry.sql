-- Pantry, shopping list, and meal planning
-- Schema is a superset of popepantry (adds unit column and snapshot JSONB on history)

CREATE TABLE pantry_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id    UUID REFERENCES households(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  category        TEXT,
  quantity        NUMERIC,
  unit            TEXT,
  price           NUMERIC(10,2),
  expiration_date DATE,
  store           TEXT,
  barcode         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE item_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id      UUID REFERENCES pantry_items(id) ON DELETE SET NULL,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id),
  action       TEXT NOT NULL,
  reason       TEXT,
  snapshot     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE shopping_suggestions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  category     TEXT,
  added_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_checked   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE meal_plans (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  planned_date DATE NOT NULL,
  meal_type    TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_name  TEXT NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS helpers: household-scoped read + own-user write
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Pantry items
CREATE POLICY "pantry_household_select" ON pantry_items FOR SELECT
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
CREATE POLICY "pantry_household_insert" ON pantry_items FOR INSERT
  WITH CHECK (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
CREATE POLICY "pantry_household_update" ON pantry_items FOR UPDATE
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
CREATE POLICY "pantry_household_delete" ON pantry_items FOR DELETE
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));

-- Item history
CREATE POLICY "history_household_select" ON item_history FOR SELECT
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
CREATE POLICY "history_own_insert" ON item_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Shopping suggestions
CREATE POLICY "shopping_household_select" ON shopping_suggestions FOR SELECT
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
CREATE POLICY "shopping_household_insert" ON shopping_suggestions FOR INSERT
  WITH CHECK (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
CREATE POLICY "shopping_household_update" ON shopping_suggestions FOR UPDATE
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
CREATE POLICY "shopping_household_delete" ON shopping_suggestions FOR DELETE
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));

-- Meal plans
CREATE POLICY "meals_household_select" ON meal_plans FOR SELECT
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
CREATE POLICY "meals_household_insert" ON meal_plans FOR INSERT
  WITH CHECK (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
CREATE POLICY "meals_own_delete" ON meal_plans FOR DELETE
  USING (user_id = auth.uid());
