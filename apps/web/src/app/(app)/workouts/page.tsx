'use client'
import { useEffect, useState } from 'react'
import { Plus, Play, Square, Clock } from 'lucide-react'
import { useHousehold } from '@/providers/HouseholdProvider'
import { useAuth } from '@/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@lifestyle/db'

type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row']
type Exercise = Database['public']['Tables']['exercises']['Row']
type SessionExercise = Database['public']['Tables']['session_exercises']['Row']

export default function WorkoutsPage() {
  const { householdId } = useHousehold()
  const { user } = useAuth()
  const supabase = createClient()
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null)
  const [sets, setSets] = useState<(SessionExercise & { exercise: Exercise })[]>([])
  const [selectedExercise, setSelectedExercise] = useState('')
  const [setForm, setSetForm] = useState({ reps: '', weight_kg: '', notes: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!householdId || !user) return
    Promise.all([
      supabase.from('workout_sessions').select('*').eq('household_id', householdId).order('started_at', { ascending: false }).limit(10),
      supabase.from('exercises').select('*').or(`household_id.is.null,household_id.eq.${householdId}`).order('name'),
    ]).then(([{ data: s }, { data: ex }]) => {
      setSessions(s ?? [])
      setExercises(ex ?? [])
      setLoading(false)
    })
  }, [householdId, user])

  const startSession = async () => {
    if (!user || !householdId) return
    const { data } = await supabase.from('workout_sessions').insert({
      user_id: user.id,
      household_id: householdId,
      started_at: new Date().toISOString(),
      title: 'Workout',
    }).select().single()
    if (data) setActiveSession(data)
  }

  const endSession = async () => {
    if (!activeSession) return
    await supabase.from('workout_sessions').update({ ended_at: new Date().toISOString() }).eq('id', activeSession.id)
    setSessions(prev => [{ ...activeSession, ended_at: new Date().toISOString() }, ...prev])
    setActiveSession(null)
    setSets([])
  }

  const logSet = async () => {
    if (!activeSession || !selectedExercise) return
    const exercise = exercises.find(e => e.id === selectedExercise)
    if (!exercise) return
    const setNumber = sets.filter(s => s.exercise_id === selectedExercise).length + 1
    const { data } = await supabase.from('session_exercises').insert({
      session_id: activeSession.id,
      exercise_id: selectedExercise,
      set_number: setNumber,
      reps: setForm.reps ? parseInt(setForm.reps) : null,
      weight_kg: setForm.weight_kg ? parseFloat(setForm.weight_kg) : null,
      notes: setForm.notes || null,
    }).select().single()
    if (data) setSets(prev => [...prev, { ...data, exercise }])
    setSetForm({ reps: '', weight_kg: '', notes: '' })
  }

  if (loading) return <div className="p-8 text-stone-400">Loading…</div>

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Workouts</h1>
        {!activeSession ? (
          <button onClick={startSession} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition-colors">
            <Play className="w-4 h-4" /> Start workout
          </button>
        ) : (
          <button onClick={endSession} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-800 dark:bg-stone-700 text-white text-sm font-semibold hover:bg-stone-700 transition-colors">
            <Square className="w-4 h-4" /> End workout
          </button>
        )}
      </div>

      {activeSession && (
        <div className="rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-semibold text-green-800 dark:text-green-200">Workout in progress</span>
          </div>

          <div className="flex gap-2 mb-3">
            <select
              value={selectedExercise}
              onChange={e => setSelectedExercise(e.target.value)}
              className="flex-1 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">Select exercise…</option>
              {exercises.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <input
              value={setForm.reps}
              onChange={e => setSetForm(p => ({ ...p, reps: e.target.value }))}
              placeholder="Reps"
              type="number"
              className="w-20 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <input
              value={setForm.weight_kg}
              onChange={e => setSetForm(p => ({ ...p, weight_kg: e.target.value }))}
              placeholder="Weight (kg)"
              type="number"
              className="w-28 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <button onClick={logSet} disabled={!selectedExercise} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold disabled:opacity-50">
              <Plus className="w-4 h-4" /> Log set
            </button>
          </div>

          {sets.length > 0 && (
            <div className="mt-4 space-y-1">
              {sets.map((s, i) => (
                <div key={s.id} className="text-sm text-green-800 dark:text-green-200">
                  {i + 1}. {s.exercise.name} — {s.reps ? `${s.reps} reps` : ''}{s.weight_kg ? ` @ ${s.weight_kg}kg` : ''}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-3">Recent sessions</h2>
      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 p-8 text-center text-stone-400">
          No workouts logged yet.
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => (
            <div key={s.id} className="rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-stone-900 dark:text-stone-50">{s.title ?? 'Workout'}</p>
                  <p className="text-xs text-stone-400">{new Date(s.started_at).toLocaleDateString()}</p>
                </div>
                {s.duration_minutes && (
                  <div className="flex items-center gap-1 text-sm text-stone-500 dark:text-stone-400">
                    <Clock className="w-4 h-4" />
                    {s.duration_minutes}m
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
