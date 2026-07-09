-- Saved recipes: a household's library of liked meals, decoupled from any
-- specific calendar date, so they can be pulled back out and scheduled again.
CREATE TABLE public.saved_recipes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_name  TEXT NOT NULL,
  notes        TEXT,
  ingredients  TEXT[],
  instructions TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_recipes_household_select" ON public.saved_recipes FOR SELECT
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
CREATE POLICY "saved_recipes_household_insert" ON public.saved_recipes FOR INSERT
  WITH CHECK (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
CREATE POLICY "saved_recipes_household_update" ON public.saved_recipes FOR UPDATE
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
CREATE POLICY "saved_recipes_household_delete" ON public.saved_recipes FOR DELETE
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));

-- Also fixes a pre-existing gap: meal_plans has never had an UPDATE policy,
-- so editing a planned meal's recipe (pantry page's edit-meal form) has always
-- silently failed under RLS.
CREATE POLICY "meals_household_update" ON public.meal_plans FOR UPDATE
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
