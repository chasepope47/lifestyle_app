import { supabase } from '../client'
import type { Database } from '../database.types'

type NutritionGoals = Database['public']['Tables']['nutrition_goals']['Row']
type FoodEntry = Database['public']['Tables']['food_entries']['Row']
type FoodEntryInsert = Database['public']['Tables']['food_entries']['Insert']

export async function getNutritionGoals(userId: string): Promise<NutritionGoals | null> {
  const { data, error } = await supabase
    .from('nutrition_goals')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error) return null
  return data
}

export async function upsertNutritionGoals(goals: Database['public']['Tables']['nutrition_goals']['Insert']): Promise<NutritionGoals> {
  const { data, error } = await supabase
    .from('nutrition_goals')
    .upsert(goals, { onConflict: 'user_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getFoodEntries(userId: string, date: string): Promise<FoodEntry[]> {
  const { data, error } = await supabase
    .from('food_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('entry_date', date)
    .order('created_at')
  if (error) throw error
  return data ?? []
}

export async function getHouseholdFoodEntries(householdId: string, date: string): Promise<FoodEntry[]> {
  const { data, error } = await supabase
    .from('food_entries')
    .select('*')
    .eq('household_id', householdId)
    .eq('entry_date', date)
    .order('user_id, created_at')
  if (error) throw error
  return data ?? []
}

export async function addFoodEntry(entry: FoodEntryInsert): Promise<FoodEntry> {
  const { data, error } = await supabase.from('food_entries').insert(entry).select().single()
  if (error) throw error
  return data
}

export async function deleteFoodEntry(id: string): Promise<void> {
  const { error } = await supabase.from('food_entries').delete().eq('id', id)
  if (error) throw error
}

export function sumMacros(entries: FoodEntry[]) {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein_g: acc.protein_g + (e.protein_g ?? 0),
      carbs_g: acc.carbs_g + (e.carbs_g ?? 0),
      fat_g: acc.fat_g + (e.fat_g ?? 0),
      fiber_g: acc.fiber_g + (e.fiber_g ?? 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
  )
}
