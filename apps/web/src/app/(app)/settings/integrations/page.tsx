'use client'
import { useEffect, useState } from 'react'
import { ExternalLink, KeyRound, Plus, Smartphone, Trash2, Watch } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useHousehold } from '@/providers/HouseholdProvider'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@lifestyle/db'

type IntegrationToken = Database['public']['Tables']['integration_tokens']['Row']
type AppShortcut = Database['public']['Tables']['app_shortcuts']['Row']
type WebAuthnCredential = Database['public']['Tables']['webauthn_credentials']['Row']

const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—'

export default function IntegrationsPage() {
  const { user } = useAuth()
  const { householdId } = useHousehold()
  const supabase = createClient()
  const [tokens, setTokens] = useState<IntegrationToken[]>([])
  const [shortcuts, setShortcuts] = useState<AppShortcut[]>([])
  const [passkeys, setPasskeys] = useState<WebAuthnCredential[]>([])
  const [passkeyWorking, setPasskeyWorking] = useState(false)
  const [passkeyError, setPasskeyError] = useState<string | null>(null)
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
      supabase.from('webauthn_credentials').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
    ]).then(([{ data: t }, { data: s }, { data: p }]) => {
      setTokens(t ?? [])
      setShortcuts(s ?? [])
      setPasskeys(p ?? [])
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

  const disconnectCanvas = async () => {
    if (!user) return
    await supabase.from('integration_tokens').delete().eq('user_id', user.id).eq('provider', 'canvas')
    setTokens(prev => prev.filter(t => t.provider !== 'canvas'))
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

  const deletePasskey = async (id: string) => {
    await supabase.from('webauthn_credentials').delete().eq('id', id)
    setPasskeys(prev => prev.filter(p => p.id !== id))
    if (passkeys.length <= 1) localStorage.removeItem('passkey_registered')
  }

  const addPasskey = async () => {
    if (!user) return
    setPasskeyWorking(true)
    setPasskeyError(null)
    try {
      const { startRegistration } = await import('@simplewebauthn/browser')
      const optionsRes = await fetch('/api/auth/webauthn/register-options', { method: 'POST' })
      if (!optionsRes.ok) { setPasskeyError('Could not start passkey registration'); return }
      const optionsData = await optionsRes.json()
      const registration = await startRegistration({ optionsJSON: optionsData })
      const deviceName = navigator.userAgent.includes('iPhone') ? 'iPhone'
        : navigator.userAgent.includes('iPad') ? 'iPad'
        : navigator.userAgent.includes('Mac') ? 'Mac'
        : navigator.userAgent.includes('Android') ? 'Android'
        : navigator.platform || 'Unknown device'
      const verifyRes = await fetch('/api/auth/webauthn/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...registration, deviceName }),
      })
      if (!verifyRes.ok) {
        const err = await verifyRes.json()
        setPasskeyError(err.error ?? 'Registration failed')
        return
      }
      localStorage.setItem('passkey_registered', '1')
      const { data } = await supabase.from('webauthn_credentials').select('*').eq('user_id', user.id).order('created_at', { ascending: true })
      setPasskeys(data ?? [])
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'NotAllowedError') {
        setPasskeyError(String(err))
      }
    } finally {
      setPasskeyWorking(false)
    }
  }

  const canvasToken = tokens.find(t => t.provider === 'canvas')

  if (loading) return <div className="p-8 text-stone-400">Loading…</div>

  return (
    <div className="px-4 py-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-2">Integrations</h1>
      <p className="text-stone-500 dark:text-stone-400 text-sm mb-8">Connect external services to sync your data automatically.</p>

      {/* Health & Fitness — mobile */}
      <div className="rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30 border border-rose-200 dark:border-rose-900 p-5 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0">
            <Watch className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-stone-900 dark:text-stone-50">Health &amp; Fitness Sync</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300">Mobile app</span>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">
              Garmin, Apple Watch, Fitbit, and other wearables sync automatically through Apple Health (iPhone) or Google Health Connect (Android). The mobile app will read your workout history, steps, heart rate, and sleep directly — no additional setup needed.
            </p>
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-stone-400" />
              <p className="text-xs text-stone-400">Available in the upcoming iOS &amp; Android app</p>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas LMS */}
      <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 mb-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-stone-900 dark:text-stone-50">Canvas LMS</h3>
              {canvasToken && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">Connected</span>
              )}
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400">Sync courses and assignments from your Canvas account.</p>
            {canvasToken && (
              <p className="text-xs text-stone-400 mt-1">
                Instance: {(canvasToken.metadata as { instance_url?: string } | null)?.instance_url ?? '—'}
              </p>
            )}
          </div>
          <div className="shrink-0">
            {canvasToken ? (
              <button onClick={disconnectCanvas} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Disconnect
              </button>
            ) : (
              <button onClick={() => setShowCanvasForm(true)} className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors">
                Connect
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Passkeys */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Passkeys</h2>
            <p className="text-sm text-stone-400 mt-0.5">Sign in with Face ID, fingerprint, or your device PIN — no password needed.</p>
          </div>
          <button
            onClick={addPasskey}
            disabled={passkeyWorking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            {passkeyWorking ? 'Registering…' : 'Add passkey'}
          </button>
        </div>
        {passkeyError && (
          <div className="mb-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
            {passkeyError}
          </div>
        )}
        {passkeys.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 p-6 text-center text-stone-400 text-sm">
            No passkeys registered yet.
          </div>
        ) : (
          <div className="space-y-2">
            {passkeys.map(pk => (
              <div key={pk.id} className="flex items-center justify-between rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                    <KeyRound className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-50">{pk.device_name ?? 'Unknown device'}</p>
                    <p className="text-xs text-stone-400">
                      Added {fmtDate(pk.created_at)}
                      {pk.last_used_at && <span> · Last used {fmtDate(pk.last_used_at)}</span>}
                      {pk.backed_up && <span> · Synced</span>}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deletePasskey(pk.id)}
                  className="p-1 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Remove passkey"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Quick Links</h2>
          <button onClick={() => setShowShortcutForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
            <Plus className="w-4 h-4" /> Add link
          </button>
        </div>
        <p className="text-sm text-stone-400 mb-4">Saved links appear as quick-access buttons in relevant modules. Add Gospel Library, study resources, etc.</p>
        {shortcuts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 p-6 text-center text-stone-400 text-sm">
            No shortcuts yet.
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
