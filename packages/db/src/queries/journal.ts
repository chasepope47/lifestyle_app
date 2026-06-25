import { supabase } from '../client'
import type { Database } from '../database.types'

type JournalEntry = Database['public']['Tables']['journal_entries']['Row']
type JournalEntryInsert = Database['public']['Tables']['journal_entries']['Insert']

export async function getJournalEntries(householdId: string, options?: {
  userId?: string
  startDate?: string
  endDate?: string
  limit?: number
}): Promise<JournalEntry[]> {
  let query = supabase
    .from('journal_entries')
    .select('*')
    .eq('household_id', householdId)
    .order('entry_date', { ascending: false })
  if (options?.userId) query = query.eq('user_id', options.userId)
  if (options?.startDate) query = query.gte('entry_date', options.startDate)
  if (options?.endDate) query = query.lte('entry_date', options.endDate)
  if (options?.limit) query = query.limit(options.limit)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getJournalEntry(id: string): Promise<JournalEntry | null> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function createJournalEntry(entry: JournalEntryInsert): Promise<JournalEntry> {
  const { data, error } = await supabase.from('journal_entries').insert(entry).select().single()
  if (error) throw error
  return data
}

export async function updateJournalEntry(id: string, updates: Database['public']['Tables']['journal_entries']['Update']): Promise<JournalEntry> {
  const { data, error } = await supabase
    .from('journal_entries')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const { error } = await supabase.from('journal_entries').delete().eq('id', id)
  if (error) throw error
}
