'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, RefreshCw, Check, Heart, Users, ArrowRight } from 'lucide-react'
import { useHousehold } from '@/providers/HouseholdProvider'
import { createClient } from '@/lib/supabase/client'
import { generateInviteCode } from '@lifestyle/shared'

function HouseholdChoice() {
  const router = useRouter()
  const supabase = createClient()
  const { refresh } = useHousehold()
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [householdName, setHouseholdName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const useSolo = async () => {
    setError(null)
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const displayName =
      (user.user_metadata?.display_name as string | undefined) ??
      user.email?.split('@')[0] ??
      'My'
    const { error: hErr } = await supabase.rpc('create_household', {
      p_name: `${displayName}'s Space`,
      p_invite_code: generateInviteCode(),
      p_invite_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      p_display_name: (user.user_metadata?.display_name as string | undefined) ?? null,
    })
    if (hErr) { setError(hErr.message); setLoading(false); return }

    await refresh()
    router.push('/dashboard')
  }

  const createHousehold = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: hErr } = await supabase.rpc('create_household', {
      p_name: householdName,
      p_invite_code: generateInviteCode(),
      p_invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      p_display_name: (user.user_metadata?.display_name as string | undefined) ?? null,
    })
    if (hErr) { setError(hErr.message); setLoading(false); return }

    await refresh()
    router.push('/dashboard')
  }

  const joinHousehold = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.rpc('join_household', { p_invite_code: inviteCode.toUpperCase() })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      await refresh()
      await router.push('/dashboard')
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  if (mode === 'choose') {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Heart className="w-6 h-6 text-rose-500" />
          <span className="text-xl font-bold text-stone-900 dark:text-stone-50">Together</span>
        </div>
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-8">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-2">Connect with a partner</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-8">
            Share your household with a partner, or skip and use the app solo — you can always connect later.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setMode('create')}
              className="flex items-center gap-3 w-full rounded-xl border-2 border-rose-500 p-4 text-left hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <Heart className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <div className="font-semibold text-stone-900 dark:text-stone-50">Invite my partner</div>
                <div className="text-sm text-stone-500 dark:text-stone-400">Generate an invite code to share</div>
              </div>
            </button>
            <button
              onClick={() => setMode('join')}
              className="flex items-center gap-3 w-full rounded-xl border border-stone-300 dark:border-stone-700 p-4 text-left hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                <Users className="w-5 h-5 text-stone-500" />
              </div>
              <div>
                <div className="font-semibold text-stone-900 dark:text-stone-50">Join my partner's household</div>
                <div className="text-sm text-stone-500 dark:text-stone-400">Enter an invite code they sent you</div>
              </div>
            </button>
            <button
              onClick={useSolo}
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full rounded-xl border border-stone-200 dark:border-stone-700 p-4 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Setting up…' : 'Skip for now — use solo'}
              <ArrowRight className="w-4 h-4" />
            </button>
            {error && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-8">
        {mode === 'create' ? (
          <>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-6">Name your household</h1>
            <form onSubmit={createHousehold} className="space-y-4">
              <input
                type="text"
                value={householdName}
                onChange={e => setHouseholdName(e.target.value)}
                required
                placeholder="The Pope Household"
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creating…' : 'Create household'}
              </button>
              <button type="button" onClick={() => setMode('choose')} className="w-full text-sm text-stone-500 hover:text-stone-700 dark:hover:text-stone-300">
                Back
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-6">Enter invite code</h1>
            <form onSubmit={joinHousehold} className="space-y-4">
              <input
                type="text"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                required
                maxLength={6}
                placeholder="ABC123"
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 text-center text-xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Joining…' : 'Join household'}
              </button>
              <button type="button" onClick={() => setMode('choose')} className="w-full text-sm text-stone-500 hover:text-stone-700 dark:hover:text-stone-300">
                Back
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default function HouseholdSettingsPage() {
  const { household, members, loading, refresh } = useHousehold()
  const supabase = createClient()
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const copyCode = async () => {
    if (!household) return
    await navigator.clipboard.writeText(household.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const regenerateCode = async () => {
    if (!household) return
    setRegenerating(true)
    const newCode = generateInviteCode()
    await supabase.from('households').update({
      invite_code: newCode,
      invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }).eq('id', household.id)
    await refresh()
    setRegenerating(false)
  }

  if (loading) return <div className="p-8 text-stone-400">Loading…</div>

  if (!household) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 px-4">
        <HouseholdChoice />
      </div>
    )
  }

  const expiresAt = new Date(household.invite_expires_at)
  const expired = expiresAt < new Date()

  return (
    <div className="px-4 py-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-6">Household settings</h1>

      {/* Household name */}
      <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 mb-4">
        <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-1">Household name</p>
        <p className="text-lg font-semibold text-stone-900 dark:text-stone-50">{household.name}</p>
      </div>

      {/* Invite code */}
      <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 mb-4">
        <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-3">Invite code</p>
        <p className="text-xs text-stone-400 mb-3">Share this code with your partner so they can join your household.</p>
        <div className="flex items-center gap-3">
          <div className={`flex-1 rounded-xl border-2 px-4 py-3 text-center font-mono text-2xl tracking-widest font-bold ${expired ? 'border-red-300 dark:border-red-800 text-red-500' : 'border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400'}`}>
            {household.invite_code}
          </div>
          <button onClick={copyCode} className="p-3 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-stone-500" />}
          </button>
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-stone-400">
            {expired ? 'Expired — regenerate below' : `Expires ${expiresAt.toLocaleDateString()}`}
          </p>
          <button onClick={regenerateCode} disabled={regenerating} className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
            New code
          </button>
        </div>
      </div>

      {/* Members */}
      <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5">
        <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-3">Members ({members.length})</p>
        <div className="space-y-3">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-sm font-bold text-rose-700 dark:text-rose-300">
                {(m.display_name ?? '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-stone-900 dark:text-stone-50">{m.display_name ?? 'Member'}</p>
                <p className="text-xs text-stone-400 capitalize">{m.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
