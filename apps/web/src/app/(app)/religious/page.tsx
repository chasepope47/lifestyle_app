'use client'
import { useEffect, useState } from 'react'
import { Plus, Check, Lock, ExternalLink } from 'lucide-react'
import { useHousehold } from '@/providers/HouseholdProvider'
import { useAuth } from '@/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { GOSPEL_LIBRARY_URL } from '@lifestyle/shared'
import type { Database } from '@lifestyle/db'

type DevotionalPlan = Database['public']['Tables']['devotional_plans']['Row']
type PrayerRequest = Database['public']['Tables']['prayer_requests']['Row']
type ScriptureNote = Database['public']['Tables']['scripture_notes']['Row']
type AppShortcut = Database['public']['Tables']['app_shortcuts']['Row']

export default function ReligiousPage() {
  const { householdId } = useHousehold()
  const { user } = useAuth()
  const supabase = createClient()
  const [plans, setPlans] = useState<DevotionalPlan[]>([])
  const [prayers, setPrayers] = useState<PrayerRequest[]>([])
  const [notes, setNotes] = useState<ScriptureNote[]>([])
  const [shortcuts, setShortcuts] = useState<AppShortcut[]>([])
  const [tab, setTab] = useState<'devotional' | 'prayer' | 'scripture'>('devotional')
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)

  // Forms
  const [prayerForm, setPrayerForm] = useState({ title: '', body: '', is_private: false })
  const [scriptureForm, setScriptureForm] = useState({ reference: '', translation: 'NIV', body: '', is_private: false })
  const [devotionalForm, setDevotionalForm] = useState({ title: '', description: '', total_days: 30, start_date: '' })

  useEffect(() => {
    if (!householdId || !user) return
    Promise.all([
      supabase.from('devotional_plans').select('*').eq('household_id', householdId).order('created_at', { ascending: false }),
      supabase.from('prayer_requests').select('*').eq('household_id', householdId).order('created_at', { ascending: false }),
      supabase.from('scripture_notes').select('*').eq('household_id', householdId).order('created_at', { ascending: false }),
      supabase.from('app_shortcuts').select('*').eq('household_id', householdId).eq('module', 'religious'),
    ]).then(([{ data: p }, { data: pr }, { data: sn }, { data: sh }]) => {
      setPlans(p ?? [])
      setPrayers(pr ?? [])
      setNotes(sn ?? [])
      setShortcuts(sh ?? [])
      setLoading(false)
    })
  }, [householdId, user])

  const addPrayer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !householdId) return
    const { data } = await supabase.from('prayer_requests').insert({
      user_id: user.id, household_id: householdId,
      title: prayerForm.title, body: prayerForm.body || null,
      is_private: prayerForm.is_private,
    }).select().single()
    if (data) setPrayers(prev => [data, ...prev])
    setShowAdd(false)
    setPrayerForm({ title: '', body: '', is_private: false })
  }

  const addScriptureNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !householdId) return
    const { data } = await supabase.from('scripture_notes').insert({
      user_id: user.id, household_id: householdId,
      reference: scriptureForm.reference,
      translation: scriptureForm.translation,
      body: scriptureForm.body || null,
      is_private: scriptureForm.is_private,
    }).select().single()
    if (data) setNotes(prev => [data, ...prev])
    setShowAdd(false)
    setScriptureForm({ reference: '', translation: 'NIV', body: '', is_private: false })
  }

  const markAnswered = async (id: string) => {
    await supabase.from('prayer_requests').update({ is_answered: true, answered_at: new Date().toISOString() }).eq('id', id)
    setPrayers(prev => prev.map(p => p.id === id ? { ...p, is_answered: true } : p))
  }

  if (loading) return <div className="p-8 text-stone-400">Loading…</div>

  return (
    <div className="px-4 py-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Faith</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition-colors">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-2 mb-6">
        <a
          href={GOSPEL_LIBRARY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 text-sm font-medium border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Gospel Library
        </a>
        {shortcuts.map(s => (
          <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm font-medium border border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />
            {s.label}
          </a>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 dark:bg-stone-800 rounded-xl p-1 mb-6">
        {(['devotional', 'prayer', 'scripture'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 shadow-sm' : 'text-stone-500 dark:text-stone-400'}`}>
            {t === 'devotional' ? 'Devotionals' : t === 'prayer' ? 'Prayer' : 'Scripture'}
          </button>
        ))}
      </div>

      {/* Devotional tab */}
      {tab === 'devotional' && (
        <div className="space-y-3">
          {plans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 p-8 text-center text-stone-400">No devotional plans yet.</div>
          ) : plans.map(plan => (
            <div key={plan.id} className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4">
              <p className="font-semibold text-stone-900 dark:text-stone-50">{plan.title}</p>
              <p className="text-sm text-stone-400">{plan.total_days}-day plan{plan.start_date ? ` · Started ${plan.start_date}` : ''}</p>
              {plan.description && <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{plan.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Prayer tab */}
      {tab === 'prayer' && (
        <div className="space-y-3">
          {prayers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 p-8 text-center text-stone-400">No prayer requests yet.</div>
          ) : prayers.filter(p => !p.is_private || p.user_id === user?.id).map(prayer => (
            <div key={prayer.id} className={`rounded-2xl bg-white dark:bg-stone-900 border p-4 ${prayer.is_answered ? 'border-green-200 dark:border-green-800 opacity-75' : 'border-stone-200 dark:border-stone-800'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {prayer.is_private && <Lock className="w-3.5 h-3.5 text-stone-400 shrink-0" />}
                    <p className="font-medium text-stone-900 dark:text-stone-50">{prayer.title}</p>
                    {prayer.is_answered && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">Answered ✓</span>
                    )}
                  </div>
                  {prayer.body && <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{prayer.body}</p>}
                </div>
                {!prayer.is_answered && prayer.user_id === user?.id && (
                  <button onClick={() => markAnswered(prayer.id)} title="Mark answered" className="p-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scripture tab */}
      {tab === 'scripture' && (
        <div className="space-y-3">
          {notes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 p-8 text-center text-stone-400">No scripture notes yet.</div>
          ) : notes.filter(n => !n.is_private || n.user_id === user?.id).map(note => (
            <div key={note.id} className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4">
              <div className="flex items-center gap-2 mb-1">
                {note.is_private && <Lock className="w-3.5 h-3.5 text-stone-400" />}
                <p className="font-semibold text-teal-700 dark:text-teal-400">{note.reference}</p>
                <span className="text-xs text-stone-400">{note.translation}</span>
              </div>
              {note.body && <p className="text-sm text-stone-600 dark:text-stone-400">{note.body}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            {/* Tab selector inside modal */}
            <div className="flex gap-1 bg-stone-100 dark:bg-stone-800 rounded-xl p-1 mb-4">
              {(['prayer', 'scripture'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50' : 'text-stone-500 dark:text-stone-400'}`}>
                  {t === 'prayer' ? 'Prayer request' : 'Scripture note'}
                </button>
              ))}
            </div>

            {tab === 'prayer' && (
              <form onSubmit={addPrayer} className="space-y-3">
                <input value={prayerForm.title} onChange={e => setPrayerForm(p => ({ ...p, title: e.target.value }))} required placeholder="Prayer request title" className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500" />
                <textarea value={prayerForm.body} onChange={e => setPrayerForm(p => ({ ...p, body: e.target.value }))} placeholder="Details (optional)" rows={4} className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none" />
                <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400 cursor-pointer">
                  <input type="checkbox" checked={prayerForm.is_private} onChange={e => setPrayerForm(p => ({ ...p, is_private: e.target.checked }))} className="rounded accent-rose-500" />
                  <Lock className="w-3.5 h-3.5" /> Keep private
                </label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-sm text-stone-700 dark:text-stone-300">Cancel</button>
                  <button type="submit" className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold">Add</button>
                </div>
              </form>
            )}

            {tab === 'scripture' && (
              <form onSubmit={addScriptureNote} className="space-y-3">
                <input value={scriptureForm.reference} onChange={e => setScriptureForm(p => ({ ...p, reference: e.target.value }))} required placeholder="Reference (e.g. John 3:16)" className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500" />
                <select value={scriptureForm.translation} onChange={e => setScriptureForm(p => ({ ...p, translation: e.target.value }))} className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500">
                  {['NIV', 'KJV', 'ESV', 'NLT', 'NASB', 'CSB', 'MSG', 'AMP'].map(t => <option key={t}>{t}</option>)}
                </select>
                <textarea value={scriptureForm.body} onChange={e => setScriptureForm(p => ({ ...p, body: e.target.value }))} placeholder="Notes or reflection" rows={4} className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none" />
                <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400 cursor-pointer">
                  <input type="checkbox" checked={scriptureForm.is_private} onChange={e => setScriptureForm(p => ({ ...p, is_private: e.target.checked }))} className="rounded accent-rose-500" />
                  <Lock className="w-3.5 h-3.5" /> Keep private
                </label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-sm text-stone-700 dark:text-stone-300">Cancel</button>
                  <button type="submit" className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold">Add</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
