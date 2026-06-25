import { supabase } from '../client'
import type { Database } from '../database.types'

type SchoolClass = Database['public']['Tables']['school_classes']['Row']
type Assignment = Database['public']['Tables']['assignments']['Row']
type AssignmentInsert = Database['public']['Tables']['assignments']['Insert']

export async function getClasses(userId: string): Promise<SchoolClass[]> {
  const { data, error } = await supabase
    .from('school_classes')
    .select('*')
    .eq('user_id', userId)
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function createClass(cls: Database['public']['Tables']['school_classes']['Insert']): Promise<SchoolClass> {
  const { data, error } = await supabase.from('school_classes').insert(cls).select().single()
  if (error) throw error
  return data
}

export async function deleteClass(id: string): Promise<void> {
  const { error } = await supabase.from('school_classes').delete().eq('id', id)
  if (error) throw error
}

export async function getAssignments(householdId: string, options?: {
  userId?: string
  classId?: string
  status?: Assignment['status']
}): Promise<Assignment[]> {
  let query = supabase
    .from('assignments')
    .select('*')
    .eq('household_id', householdId)
    .order('due_date', { ascending: true, nullsFirst: false })
  if (options?.userId) query = query.eq('user_id', options.userId)
  if (options?.classId) query = query.eq('class_id', options.classId)
  if (options?.status) query = query.eq('status', options.status)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function createAssignment(assignment: AssignmentInsert): Promise<Assignment> {
  const { data, error } = await supabase.from('assignments').insert(assignment).select().single()
  if (error) throw error
  return data
}

export async function updateAssignment(id: string, updates: Database['public']['Tables']['assignments']['Update']): Promise<Assignment> {
  const { data, error } = await supabase
    .from('assignments')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteAssignment(id: string): Promise<void> {
  const { error } = await supabase.from('assignments').delete().eq('id', id)
  if (error) throw error
}

export async function upsertCanvasAssignment(assignment: AssignmentInsert & { external_id: string }): Promise<Assignment> {
  const { data, error } = await supabase
    .from('assignments')
    .upsert(assignment, { onConflict: 'user_id,provider,external_id' })
    .select()
    .single()
  if (error) throw error
  return data
}
