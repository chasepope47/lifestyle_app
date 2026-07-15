'use client'
import { useEffect, useState } from 'react'
import { Plus, Repeat, X } from 'lucide-react'
import { useHousehold } from '@/providers/HouseholdProvider'
import { useAuth } from '@/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@lifestyle/shared'
import type { Database } from '@lifestyle/db'

type Subscription = Database['public']['Tables']['subscriptions']['Row']

const MONTHLY_FACTOR: Record<Subscription['billing_cycle'], number> = {
  weekly: 52 / 12,
  monthly: 1,
  yearly: 1 / 12,
}

const CYCLE_LABELS: Record<Subscription['billing_cycle'], string> = {
  weekly: '/wk', monthly: '/mo', yearly: '/yr',
}

export function SubscriptionsPanel() {
  const { householdId } = useHousehold()
  const { user } = useAuth()
  const supabase = createClient()

  const [subs, setSubs] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', amount: '', billing_cycle: 'monthly' as Subscription['billing_cycle'], next_charge_date: '' })

  const load = async () => {
    if (!householdId) return
    const { data } = await supabase.from('subscriptions').select('*').eq('household_id', householdId).eq('is_active', true).order('name')
    setSubs(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [householdId])

  const addSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !householdId || !form.name || !form.amount) return
    const { data } = await supabase.from('subscriptions').insert({
      user_id: user.id,
      household_id: householdId,
      name: form.name,
      amount: Number(form.amount),
      billing_cycle: form.billing_cycle,
      next_charge_date: form.next_charge_date || null,
    }).select().single()
    if (data) setSubs(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    setShowAdd(false)
    setForm({ name: '', amount: '', billing_cycle: 'monthly', next_charge_date: '' })
  }

  const cancelSubscription = async (id: string) => {
    await supabase.from('subscriptions').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id)
    setSubs(prev => prev.filter(s => s.id !== id))
  }

  const monthlyTotal = subs.reduce((sum, s) => sum + s.amount * MONTHLY_FACTOR[s.billing_cycle], 0)

  if (loading) return null

  return (
    <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Repeat className="w-4 h-4 text-stone-400" />
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Subscriptions</h3>
        </div>
        <button onClick={() => setShowAdd(true)} className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {subs.length === 0 ? (
        <p className="text-sm text-stone-400">No subscriptions tracked yet.</p>
      ) : (
        <>
          <div className="space-y-2 mb-3">
            {subs.map(s => (
              <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-stone-700 dark:text-stone-300 truncate">{s.name}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-stone-500 dark:text-stone-400 font-mono text-xs">
                    {formatCurrency(s.amount)}{CYCLE_LABELS[s.billing_cycle]}
                  </span>
                  <button onClick={() => cancelSubscription(s.id)} className="text-stone-300 hover:text-red-500" title="Cancel">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center">
            <span className="text-xs text-stone-400">Est. monthly total</span>
            <span className="text-sm font-semibold text-stone-900 dark:text-stone-50">{formatCurrency(monthlyTotal)}/mo</span>
          </div>
        </>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-stone-900 dark:text-stone-50 mb-4">Add subscription</h3>
            <form onSubmit={addSubscription} className="space-y-3">
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Name (e.g. Netflix)" className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500" />
              <input type="number" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required placeholder="Amount" className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500" />
              <select value={form.billing_cycle} onChange={e => setForm(p => ({ ...p, billing_cycle: e.target.value as Subscription['billing_cycle'] }))} className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500">
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="weekly">Weekly</option>
              </select>
              <input type="date" value={form.next_charge_date} onChange={e => setForm(p => ({ ...p, next_charge_date: e.target.value }))} className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500" />
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
