import { supabase } from '../client'
import type { Database } from '../database.types'

type Exercise = Database['public']['Tables']['exercises']['Row']
type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row']
type WorkoutSessionInsert = Database['public']['Tables']['workout_sessions']['Insert']
type SessionExercise = Database['public']['Tables']['session_exercises']['Row']
type SessionExerciseInsert = Database['public']['Tables']['session_exercises']['Insert']
type HealthMetric = Database['public']['Tables']['health_metrics']['Row']

export async function getExercises(householdId: string): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .or(`household_id.is.null,household_id.eq.${householdId}`)
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function createCustomExercise(exercise: Database['public']['Tables']['exercises']['Insert']): Promise<Exercise> {
  const { data, error } = await supabase.from('exercises').insert(exercise).select().single()
  if (error) throw error
  return data
}

export async function getWorkoutSessions(householdId: string, options?: { userId?: string; limit?: number }): Promise<WorkoutSession[]> {
  let query = supabase
    .from('workout_sessions')
    .select('*')
    .eq('household_id', householdId)
    .order('started_at', { ascending: false })
  if (options?.userId) query = query.eq('user_id', options.userId)
  if (options?.limit) query = query.limit(options.limit)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function startWorkoutSession(session: WorkoutSessionInsert): Promise<WorkoutSession> {
  const { data, error } = await supabase.from('workout_sessions').insert(session).select().single()
  if (error) throw error
  return data
}

export async function endWorkoutSession(id: string): Promise<void> {
  const { error } = await supabase
    .from('workout_sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function getSessionExercises(sessionId: string): Promise<(SessionExercise & { exercises: Exercise })[]> {
  const { data, error } = await supabase
    .from('session_exercises')
    .select('*, exercises(*)')
    .eq('session_id', sessionId)
    .order('set_number')
  if (error) throw error
  return (data ?? []) as (SessionExercise & { exercises: Exercise })[]
}

export async function logSet(set: SessionExerciseInsert): Promise<SessionExercise> {
  const { data, error } = await supabase.from('session_exercises').insert(set).select().single()
  if (error) throw error
  return data
}

export async function deleteSet(id: string): Promise<void> {
  const { error } = await supabase.from('session_exercises').delete().eq('id', id)
  if (error) throw error
}

export async function getHealthMetrics(userId: string, startDate: string, endDate: string): Promise<HealthMetric[]> {
  const { data, error } = await supabase
    .from('health_metrics')
    .select('*')
    .eq('user_id', userId)
    .gte('metric_date', startDate)
    .lte('metric_date', endDate)
    .order('metric_date')
  if (error) throw error
  return data ?? []
}

export async function upsertHealthMetrics(metric: Database['public']['Tables']['health_metrics']['Insert']): Promise<void> {
  const { error } = await supabase
    .from('health_metrics')
    .upsert(metric, { onConflict: 'user_id,source,metric_date' })
  if (error) throw error
}
