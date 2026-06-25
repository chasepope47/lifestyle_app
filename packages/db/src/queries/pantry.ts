import { supabase } from '../client'
import type { Database } from '../database.types'

type PantryItem = Database['public']['Tables']['pantry_items']['Row']
type PantryItemInsert = Database['public']['Tables']['pantry_items']['Insert']
type ShoppingSuggestion = Database['public']['Tables']['shopping_suggestions']['Row']
type MealPlan = Database['public']['Tables']['meal_plans']['Row']
type MealPlanInsert = Database['public']['Tables']['meal_plans']['Insert']

export async function getPantryItems(householdId: string): Promise<PantryItem[]> {
  const { data, error } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('household_id', householdId)
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function addPantryItem(item: PantryItemInsert): Promise<PantryItem> {
  const { data, error } = await supabase.from('pantry_items').insert(item).select().single()
  if (error) throw error
  return data
}

export async function updatePantryItem(id: string, updates: Database['public']['Tables']['pantry_items']['Update']): Promise<PantryItem> {
  const { data, error } = await supabase
    .from('pantry_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePantryItem(id: string, reason: string, userId: string, householdId: string): Promise<void> {
  const { data: item } = await supabase.from('pantry_items').select('*').eq('id', id).single()
  if (item) {
    await supabase.from('item_history').insert({
      item_id: id,
      household_id: householdId,
      user_id: userId,
      action: 'removed',
      reason,
      snapshot: item as unknown as Database['public']['Tables']['item_history']['Insert']['snapshot'],
    })
  }
  const { error } = await supabase.from('pantry_items').delete().eq('id', id)
  if (error) throw error
}

export async function getShoppingSuggestions(householdId: string): Promise<ShoppingSuggestion[]> {
  const { data, error } = await supabase
    .from('shopping_suggestions')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function addShoppingSuggestion(householdId: string, name: string, category: string | null, addedBy: string): Promise<ShoppingSuggestion> {
  const { data, error } = await supabase
    .from('shopping_suggestions')
    .insert({ household_id: householdId, name, category, added_by: addedBy })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function toggleShoppingSuggestion(id: string, isChecked: boolean): Promise<void> {
  const { error } = await supabase.from('shopping_suggestions').update({ is_checked: isChecked }).eq('id', id)
  if (error) throw error
}

export async function getMealPlans(householdId: string, startDate: string, endDate: string): Promise<MealPlan[]> {
  const { data, error } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('household_id', householdId)
    .gte('planned_date', startDate)
    .lte('planned_date', endDate)
    .order('planned_date')
  if (error) throw error
  return data ?? []
}

export async function addMealPlan(plan: MealPlanInsert): Promise<MealPlan> {
  const { data, error } = await supabase.from('meal_plans').insert(plan).select().single()
  if (error) throw error
  return data
}

export async function deleteMealPlan(id: string): Promise<void> {
  const { error } = await supabase.from('meal_plans').delete().eq('id', id)
  if (error) throw error
}
