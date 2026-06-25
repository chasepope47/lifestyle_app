import { supabase } from '../client'
import type { Database } from '../database.types'

type DevotionalPlan = Database['public']['Tables']['devotional_plans']['Row']
type DevotionalProgress = Database['public']['Tables']['devotional_progress']['Row']
type PrayerRequest = Database['public']['Tables']['prayer_requests']['Row']
type ScriptureNote = Database['public']['Tables']['scripture_notes']['Row']

export async function getDevotionalPlans(householdId: string): Promise<DevotionalPlan[]> {
  const { data, error } = await supabase
    .from('devotional_plans')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createDevotionalPlan(plan: Database['public']['Tables']['devotional_plans']['Insert']): Promise<DevotionalPlan> {
  const { data, error } = await supabase.from('devotional_plans').insert(plan).select().single()
  if (error) throw error
  return data
}

export async function getDevotionalProgress(planId: string, userId: string): Promise<DevotionalProgress[]> {
  const { data, error } = await supabase
    .from('devotional_progress')
    .select('*')
    .eq('plan_id', planId)
    .eq('user_id', userId)
    .order('day_number')
  if (error) throw error
  return data ?? []
}

export async function markDevotionalDay(planId: string, userId: string, dayNumber: number, notes?: string): Promise<void> {
  const { error } = await supabase
    .from('devotional_progress')
    .upsert(
      { plan_id: planId, user_id: userId, day_number: dayNumber, completed_at: new Date().toISOString(), notes: notes ?? null },
      { onConflict: 'plan_id,user_id,day_number' }
    )
  if (error) throw error
}

export async function getPrayerRequests(householdId: string): Promise<PrayerRequest[]> {
  const { data, error } = await supabase
    .from('prayer_requests')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createPrayerRequest(request: Database['public']['Tables']['prayer_requests']['Insert']): Promise<PrayerRequest> {
  const { data, error } = await supabase.from('prayer_requests').insert(request).select().single()
  if (error) throw error
  return data
}

export async function markPrayerAnswered(id: string): Promise<void> {
  const { error } = await supabase
    .from('prayer_requests')
    .update({ is_answered: true, answered_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deletePrayerRequest(id: string): Promise<void> {
  const { error } = await supabase.from('prayer_requests').delete().eq('id', id)
  if (error) throw error
}

export async function getScriptureNotes(householdId: string, userId: string): Promise<ScriptureNote[]> {
  const { data, error } = await supabase
    .from('scripture_notes')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).filter(n => !n.is_private || n.user_id === userId)
}

export async function createScriptureNote(note: Database['public']['Tables']['scripture_notes']['Insert']): Promise<ScriptureNote> {
  const { data, error } = await supabase.from('scripture_notes').insert(note).select().single()
  if (error) throw error
  return data
}

export async function deleteScriptureNote(id: string): Promise<void> {
  const { error } = await supabase.from('scripture_notes').delete().eq('id', id)
  if (error) throw error
}

export async function getAppShortcuts(householdId: string, userId: string): Promise<Database['public']['Tables']['app_shortcuts']['Row'][]> {
  const { data, error } = await supabase
    .from('app_shortcuts')
    .select('*')
    .or(`household_id.eq.${householdId},user_id.eq.${userId}`)
    .order('created_at')
  if (error) throw error
  return data ?? []
}

export async function createAppShortcut(shortcut: Database['public']['Tables']['app_shortcuts']['Insert']): Promise<Database['public']['Tables']['app_shortcuts']['Row']> {
  const { data, error } = await supabase.from('app_shortcuts').insert(shortcut).select().single()
  if (error) throw error
  return data
}

export async function deleteAppShortcut(id: string): Promise<void> {
  const { error } = await supabase.from('app_shortcuts').delete().eq('id', id)
  if (error) throw error
}
