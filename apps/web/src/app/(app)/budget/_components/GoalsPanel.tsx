'use client'
import { useEffect, useState } from 'react'
import { Plus, Target } from 'lucide-react'
import { useHousehold } from '@/providers/HouseholdProvider'
import { useAuth } from '@/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@lifestyle/shared'
import type { Database } from '@lifestyle/db'

type Goal = Database['public']['Tables']['budget_goals']['Row']

const GOAL_TYPE_LABELS: Record<Goal['goal_type'], string> = {
  savings: 'Savings', spending_limit: 'Spending Limit', debt_payoff: 'Debt Payoff',
}

export function GoalsPanel() {
  const { householdId } = useHousehold()
  const { user } = useAuth()
  const supabase = createClient()

  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', goal_type: 'savings' as Goal['goal_type'], target_amount: '', target_date: '' })

  const load = async () => {
    if (!householdId) return
    const { data } = await supabase.from('budget_goals').select('*').eq('household_id', householdId).is('achieved_at', null).order('target_date', { ascending: true, nullsFirst: false })
    setGoals(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [householdId])

  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !householdId || !form.name || !form.target_amount) return
    const { data } = await supabase.from('budget_goals').insert({
      household_id: householdId,
      created_by: user.id,
      name: form.name,
      goal_type: form.goal_type,
      target_amount: Number(form.target_amount),
      target_date: form.target_date || null,
    }).select().single()
    if (data) setGoals(prev => [...prev, data])
    setShowAdd(false)
    setForm({ name: '', goal_type: 'savings', target_amount: '', target_date: '' })
  }

  const updateProgress = async (id: string, current_amount: number) => {
    const goal = goals.find(g => g.id === id)
    const achieved = goal && current_amount >= goal.target_amount
    await supabase.from('budget_goals').update({
      current_amount,
      achieved_at: achieved ? new Date().toISOString() : null,
    }).eq('id', id)
    if (achieved) setGoals(prev => prev.filter(g => g.id !== id))
    else setGoals(prev => prev.map(g => g.id === id ? { ...g, current_amount } : g))
  }

  if (loading) return null

  return (
    <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-stone-400" />
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Goals</h3>
        </div>
        <button onClick={() => setShowAdd(true)} className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {goals.length === 0 ? (
        <p className="text-sm text-stone-400">No active goals.</p>
      ) : (
        <div className="space-y-3">
          {goals.map(g => {
            const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100))
            return (
              <div key={g.id}>
                <div className="flex items-center justify-between mb-1 text-sm">
                  <span className="text-stone-700 dark:text-stone-300 truncate">{g.name}</span>
                  <span className="text-xs text-stone-400">{GOAL_TYPE_LABELS[g.goal_type]}</span>
                </div>
                <div className="h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden mb-1">
                  <div className="h-full bg-rose-500" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-400 flex-1">
                    {formatCurrency(g.current_amount)} / {formatCurrency(g.target_amount)}
                  </span>
                  <input
                    type="number" step="0.01" defaultValue={g.current_amount}
                    onBlur={e => { const v = Number(e.target.value); if (!isNaN(v) && v !== g.current_amount) updateProgress(g.id, v) }}
                    className="w-24 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-2 py-1 text-stone-700 dark:text-stone-300 focus:outline-none"
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-stone-900 dark:text-stone-50 mb-4">Add goal</h3>
            <form onSubmit={addGoal} className="space-y-3">
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Goal name (e.g. Emergency fund)" className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500" />
              <select value={form.goal_type} onChange={e => setForm(p => ({ ...p, goal_type: e.target.value as Goal['goal_type'] }))} className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500">
                <option value="savings">Savings</option>
                <option value="spending_limit">Spending Limit</option>
                <option value="debt_payoff">Debt Payoff</option>
              </select>
              <input type="number" step="0.01" value={form.target_amount} onChange={e => setForm(p => ({ ...p, target_amount: e.target.value }))} required placeholder="Target amount" className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500" />
              <input type="date" value={form.target_date} onChange={e => setForm(p => ({ ...p, target_date: e.target.value }))} className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-sm font-medium text-stone-700 dark:text-stone-300">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
