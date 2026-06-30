'use client'
import { useEffect, useState } from 'react'
import { Plus, Lock, Globe } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import { useHousehold } from '@/providers/HouseholdProvider'
import { useAuth } from '@/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { MOOD_OPTIONS, todayISO } from '@lifestyle/shared'
import type { Database } from '@lifestyle/db'

type JournalEntry = Database['public']['Tables']['journal_entries']['Row']

export default function JournalPage() {
  const { householdId } = useHousehold()
  const { user } = useAuth()
  const supabase = createClient()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', mood: '', is_private: false })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!householdId) return
    supabase.from('journal_entries').select('*').eq('household_id', householdId)
      .order('entry_date', { ascending: false }).order('created_at', { ascending: false })
      .then(({ data }) => { setEntries(data ?? []); setLoading(false) })
  }, [householdId])

  const addEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !householdId) return
    const { data } = await supabase.from('journal_entries').insert({
      user_id: user.id,
      household_id: householdId,
      title: form.title || null,
      body: form.body,
      mood: (form.mood as JournalEntry['mood']) || null,
      is_private: form.is_private,
      entry_date: todayISO(),
    }).select().single()
    if (data) setEntries(prev => [data, ...prev])
    setShowAdd(false)
    setForm({ title: '', body: '', mood: '', is_private: false })
  }

  if (loading) return <div className="p-8 text-stone-400">Loading…</div>

  return (
    <div className="pb-20 lg:pb-10">
      <PageHero
        title="Journal"
        subtitle="Personal & shared entries"
        gradient="linear-gradient(135deg, #1a0015 0%, #3d002e 35%, #1a0012 65%, #0d0c11 100%)"
        accentHex="#f472b6"
        action={
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors" style={{ background: 'rgba(244,114,182,0.25)', border: '1px solid rgba(244,114,182,0.3)' }}>
            <Plus className="w-4 h-4" /> New entry
          </button>
        }
      />
      <div className="px-4 pt-6 max-w-2xl mx-auto">

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 p-8 text-center text-stone-400">
          No journal entries yet. Write your first one!
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map(entry => {
            const isOwn = entry.user_id === user?.id
            const isBlurred = !isOwn && entry.is_private

            return (
              <div key={entry.id} className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 relative overflow-hidden">
                {isBlurred && (
                  <div className="absolute inset-0 backdrop-blur-sm bg-white/60 dark:bg-stone-900/60 flex items-center justify-center z-10">
                    <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
                      <Lock className="w-4 h-4" />
                      <span className="text-sm">Private entry</span>
                    </div>
                  </div>
                )}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {entry.is_private
                      ? <Lock className="w-3.5 h-3.5 text-stone-400" />
                      : <Globe className="w-3.5 h-3.5 text-stone-400" />
                    }
                    <span className="text-xs text-stone-400">{entry.entry_date}</span>
                    {entry.mood && (
                      <span className="text-sm">{MOOD_OPTIONS.find(m => m.value === entry.mood)?.emoji}</span>
                    )}
                  </div>
                  {!isOwn && (
                    <span className="text-xs text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full">Partner</span>
                  )}
                </div>
                {entry.title && (
                  <h3 className="font-semibold text-stone-900 dark:text-stone-50 mb-1">{entry.title}</h3>
                )}
                <p className="text-sm text-stone-600 dark:text-stone-400 whitespace-pre-wrap line-clamp-4">{entry.body}</p>
              </div>
            )
          })}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
            <h3 className="font-semibold text-stone-900 dark:text-stone-50 mb-4">New journal entry</h3>
            <form onSubmit={addEntry} className="flex flex-col flex-1 space-y-3">
              <input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Title (optional)"
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <textarea
                value={form.body}
                onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                placeholder="What's on your mind today?"
                required
                rows={6}
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
              />
              <div className="flex gap-2 flex-wrap">
                {MOOD_OPTIONS.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, mood: p.mood === m.value ? '' : m.value }))}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${form.mood === m.value ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'}`}
                  >
                    {m.emoji} {m.label}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_private}
                  onChange={e => setForm(p => ({ ...p, is_private: e.target.checked }))}
                  className="rounded border-stone-300 dark:border-stone-700 accent-rose-500"
                />
                <Lock className="w-3.5 h-3.5" />
                Keep private (only visible to me)
              </label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-sm font-medium text-stone-700 dark:text-stone-300">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold">Save entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
