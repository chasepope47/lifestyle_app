'use client'
import { useEffect, useState } from 'react'
import { ExternalLink, Trash2, RefreshCw, Plus } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useHousehold } from '@/providers/HouseholdProvider'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@lifestyle/db'

type IntegrationToken = Database['public']['Tables']['integration_tokens']['Row']
type AppShortcut = Database['public']['Tables']['app_shortcuts']['Row']

const INTEGRATIONS = [
  {
    id: 'garmin' as const,
    name: 'Garmin Connect',
    description: 'Sync workouts, steps, heart rate, and sleep from your Garmin device.',
    docsUrl: 'https://developer.garmin.com/gc-developer-program/overview/',
  },
  {
    id: 'bevel' as const,
    name: 'Bevel Health',
    description: 'Aggregate health data from multiple wearables into one sync.',
    docsUrl: '#',
  },
  {
    id: 'canvas' as const,
    name: 'Canvas LMS',
    description: 'Sync courses and assignments from your Canvas account.',
    docsUrl: 'https://canvas.instructure.com/doc/api/',
  },
]

export default function IntegrationsPage() {
  const { user } = useAuth()
  const { householdId } = useHousehold()
  const supabase = createClient()
  const [tokens, setTokens] = useState<IntegrationToken[]>([])
  const [shortcuts, setShortcuts] = useState<AppShortcut[]>([])
  const [canvasForm, setCanvasForm] = useState({ instanceUrl: '', token: '' })
  const [showCanvasForm, setShowCanvasForm] = useState(false)
  const [shortcutForm, setShortcutForm] = useState({ label: '', url: '', module: '' })
  const [showShortcutForm, setShowShortcutForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !householdId) return
    Promise.all([
      supabase.from('integration_tokens').select('*').eq('user_id', user.id),
      supabase.from('app_shortcuts').select('*').eq('household_id', householdId),
    ]).then(([{ data: t }, { data: s }]) => {
      setTokens(t ?? [])
      setShortcuts(s ?? [])
      setLoading(false)
    })
  }, [user, householdId])

  const connectCanvas = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const { data, error } = await supabase.from('integration_tokens').upsert({
      user_id: user.id,
      provider: 'canvas',
      access_token: canvasForm.token,
      metadata: { instance_url: canvasForm.instanceUrl },
    }, { onConflict: 'user_id,provider' }).select().single()
    if (!error && data) setTokens(prev => [...prev.filter(t => t.provider !== 'canvas'), data])
    setShowCanvasForm(false)
    setCanvasForm({ instanceUrl: '', token: '' })
  }

  const disconnectProvider = async (provider: IntegrationToken['provider']) => {
    if (!user) return
    await supabase.from('integration_tokens').delete().eq('user_id', user.id).eq('provider', provider)
    setTokens(prev => prev.filter(t => t.provider !== provider))
  }

  const connectGarmin = () => {
    const clientId = process.env.NEXT_PUBLIC_GARMIN_CLIENT_ID
    if (!clientId) { alert('Garmin OAuth not configured. Set GARMIN_CLIENT_ID in .env.'); return }
    const state = Math.random().toString(36).slice(2)
    const redirectUri = `${window.location.origin}/api/auth/garmin/callback`
    const url = `https://connect.garmin.com/oauth2Confirm?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}&scope=ACTIVITY_EXPORT DAILY_SUMMARY SLEEP`
    window.location.href = url
  }

  const connectBevel = () => {
    const clientId = process.env.NEXT_PUBLIC_BEVEL_CLIENT_ID
    const baseUrl = process.env.NEXT_PUBLIC_BEVEL_API_BASE_URL
    if (!clientId || !baseUrl) { alert('Bevel OAuth not configured. Set BEVEL_CLIENT_ID in .env.'); return }
    const state = Math.random().toString(36).slice(2)
    const redirectUri = `${window.location.origin}/api/auth/bevel/callback`
    const url = `${baseUrl}/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}&scope=workouts metrics:read`
    window.location.href = url
  }

  const addShortcut = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !householdId) return
    const { data } = await supabase.from('app_shortcuts').insert({
      user_id: user.id,
      household_id: householdId,
      label: shortcutForm.label,
      url: shortcutForm.url,
      module: shortcutForm.module || null,
    }).select().single()
    if (data) setShortcuts(prev => [...prev, data])
    setShowShortcutForm(false)
    setShortcutForm({ label: '', url: '', module: '' })
  }

  const deleteShortcut = async (id: string) => {
    await supabase.from('app_shortcuts').delete().eq('id', id)
    setShortcuts(prev => prev.filter(s => s.id !== id))
  }

  if (loading) return <div className="p-8 text-stone-400">Loading…</div>

  return (
    <div className="px-4 py-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-2">Integrations</h1>
      <p className="text-stone-500 dark:text-stone-400 text-sm mb-8">Connect external services to sync your data automatically.</p>

      {/* Service integrations */}
      <div className="space-y-4 mb-10">
        {INTEGRATIONS.map(integration => {
          const connected = tokens.find(t => t.provider === integration.id)
          return (
            <div key={integration.id} className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-stone-900 dark:text-stone-50">{integration.name}</h3>
                    {connected && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">Connected</span>
                    )}
                  </div>
                  <p className="text-sm text-stone-500 dark:text-stone-400">{integration.description}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {connected ? (
                    <button onClick={() => disconnectProvider(integration.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Disconnect
                    </button>
                  ) : (
                    <>
                      {integration.id === 'garmin' && (
                        <button onClick={connectGarmin} className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors">
                          Connect
                        </button>
                      )}
                      {integration.id === 'bevel' && (
                        <button onClick={connectBevel} className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors">
                          Connect
                        </button>
                      )}
                      {integration.id === 'canvas' && (
                        <button onClick={() => setShowCanvasForm(true)} className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors">
                          Connect
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Links / App Shortcuts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Quick Links</h2>
          <button onClick={() => setShowShortcutForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
            <Plus className="w-4 h-4" /> Add link
          </button>
        </div>
        <p className="text-sm text-stone-400 mb-4">Saved links appear as quick-access buttons in relevant modules.</p>
        {shortcuts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 p-6 text-center text-stone-400 text-sm">
            No shortcuts yet. Add links to Gospel Library, study resources, etc.
          </div>
        ) : (
          <div className="space-y-2">
            {shortcuts.map(s => (
              <div key={s.id} className="flex items-center justify-between rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-4 py-3">
                <div className="flex items-center gap-3">
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium text-rose-500 hover:text-rose-600">
                    <ExternalLink className="w-4 h-4" />
                    {s.label}
                  </a>
                  {s.module && <span className="text-xs text-stone-400 capitalize">{s.module}</span>}
                </div>
                <button onClick={() => deleteShortcut(s.id)} className="p-1 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Canvas form modal */}
      {showCanvasForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-stone-900 dark:text-stone-50 mb-1">Connect Canvas</h3>
            <p className="text-xs text-stone-400 mb-4">Generate an API token in Canvas → Account → Settings → Approved Integrations.</p>
            <form onSubmit={connectCanvas} className="space-y-3">
              <input value={canvasForm.instanceUrl} onChange={e => setCanvasForm(p => ({ ...p, instanceUrl: e.target.value }))} required placeholder="https://yourschool.instructure.com" className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500" />
              <input value={canvasForm.token} onChange={e => setCanvasForm(p => ({ ...p, token: e.target.value }))} required placeholder="Canvas API token" type="password" className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCanvasForm(false)} className="flex-1 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-sm text-stone-700 dark:text-stone-300">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold">Connect</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shortcut form modal */}
      {showShortcutForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-stone-900 dark:text-stone-50 mb-4">Add quick link</h3>
            <form onSubmit={addShortcut} className="space-y-3">
              <input value={shortcutForm.label} onChange={e => setShortcutForm(p => ({ ...p, label: e.target.value }))} required placeholder="Label (e.g. Gospel Library)" className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500" />
              <input value={shortcutForm.url} onChange={e => setShortcutForm(p => ({ ...p, url: e.target.value }))} required type="url" placeholder="https://…" className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500" />
              <select value={shortcutForm.module} onChange={e => setShortcutForm(p => ({ ...p, module: e.target.value }))} className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500">
                <option value="">No module (show everywhere)</option>
                {['budget', 'pantry', 'nutrition', 'workouts', 'journal', 'school', 'religious'].map(m => (
                  <option key={m} value={m} className="capitalize">{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                ))}
              </select>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowShortcutForm(false)} className="flex-1 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-sm text-stone-700 dark:text-stone-300">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
