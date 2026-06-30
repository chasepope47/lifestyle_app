'use client'
import { useEffect, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import { useHousehold } from '@/providers/HouseholdProvider'
import { useAuth } from '@/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { relativeDays } from '@lifestyle/shared'
import type { Database } from '@lifestyle/db'

type Assignment = Database['public']['Tables']['assignments']['Row']
type SchoolClass = Database['public']['Tables']['school_classes']['Row']

const STATUS_COLUMNS: Assignment['status'][] = ['todo', 'in_progress', 'submitted', 'graded']
const STATUS_LABELS: Record<Assignment['status'], string> = {
  todo: 'To Do', in_progress: 'In Progress', submitted: 'Submitted', graded: 'Graded',
}
const STATUS_COLORS: Record<Assignment['status'], string> = {
  todo: 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400',
  in_progress: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  submitted: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  graded: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
}

export default function SchoolPage() {
  const { householdId } = useHousehold()
  const { user } = useAuth()
  const supabase = createClient()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [form, setForm] = useState({ title: '', class_id: '', due_date: '', description: '' })
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!householdId || !user) return
    const [{ data: a }, { data: c }] = await Promise.all([
      supabase.from('assignments').select('*').eq('household_id', householdId).order('due_date', { ascending: true, nullsFirst: false }),
      supabase.from('school_classes').select('*').eq('user_id', user.id).order('name'),
    ])
    setAssignments(a ?? [])
    setClasses(c ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [householdId, user])

  const addAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !householdId) return
    const { data } = await supabase.from('assignments').insert({
      user_id: user.id,
      household_id: householdId,
      title: form.title,
      class_id: form.class_id || null,
      due_date: form.due_date || null,
      description: form.description || null,
      status: 'todo',
    }).select().single()
    if (data) setAssignments(prev => [...prev, data])
    setShowAdd(false)
    setForm({ title: '', class_id: '', due_date: '', description: '' })
  }

  const updateStatus = async (id: string, status: Assignment['status']) => {
    await supabase.from('assignments').update({ status }).eq('id', id)
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  const syncCanvas = async () => {
    const token = prompt('Enter your Canvas API token and instance URL in Settings → Integrations.')
    if (!token) return
    setSyncing(false)
    alert('Set up your Canvas token in Settings → Integrations first.')
  }

  if (loading) return <div className="p-8 text-stone-400">Loading…</div>

  return (
    <div className="pb-20 lg:pb-10">
      <PageHero
        title="School"
        subtitle="Assignments, grades & deadlines"
        gradient="linear-gradient(135deg, #1a0a00 0%, #3d1800 35%, #1a0800 65%, #0d0c11 100%)"
        accentHex="#fb923c"
        action={
          <div className="flex gap-2">
            <button onClick={syncCanvas} disabled={syncing} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} /> Canvas
            </button>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors" style={{ background: 'rgba(251,146,60,0.25)', border: '1px solid rgba(251,146,60,0.3)' }}>
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        }
      />
      <div className="px-4 pt-6 max-w-5xl mx-auto">

      {/* Kanban board */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATUS_COLUMNS.map(status => {
          const cols = assignments.filter(a => a.status === status)
          return (
            <div key={status} className="bg-stone-100 dark:bg-stone-800/50 rounded-2xl p-3">
              <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
                {STATUS_LABELS[status]} ({cols.length})
              </h3>
              <div className="space-y-2">
                {cols.map(a => {
                  const cls = classes.find(c => c.id === a.class_id)
                  return (
                    <div key={a.id} className="rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3">
                      <p className="text-sm font-medium text-stone-900 dark:text-stone-50 mb-1">{a.title}</p>
                      {cls && (
                        <span className="inline-block text-xs px-2 py-0.5 rounded-full mb-2" style={{ background: cls.color ?? '#e5e7eb', color: '#1c1917' }}>
                          {cls.name}
                        </span>
                      )}
                      {a.due_date && (
                        <p className="text-xs text-stone-400 mb-2">{relativeDays(a.due_date.slice(0, 10))}</p>
                      )}
                      {a.grade != null && (
                        <p className="text-xs font-semibold text-green-600 mb-2">{a.grade}/{a.grade_scale}</p>
                      )}
                      <select
                        value={a.status}
                        onChange={e => updateStatus(a.id, e.target.value as Assignment['status'])}
                        className="w-full text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-2 py-1 text-stone-700 dark:text-stone-300 focus:outline-none"
                      >
                        {STATUS_COLUMNS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-stone-900 dark:text-stone-50 mb-4">Add assignment</h3>
            <form onSubmit={addAssignment} className="space-y-3">
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required placeholder="Title" className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500" />
              <select value={form.class_id} onChange={e => setForm(p => ({ ...p, class_id: e.target.value }))} className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500">
                <option value="">No class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="datetime-local" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500" />
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Description (optional)" rows={3} className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-sm font-medium text-stone-700 dark:text-stone-300">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
