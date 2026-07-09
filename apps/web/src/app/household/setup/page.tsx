'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Users, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { generateInviteCode } from '@lifestyle/shared'

export default function HouseholdSetupPage() {
  const router = useRouter()
  const supabase = createClient()
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
    const { data: household, error: hErr } = await supabase
      .from('households')
      .insert({
        name: `${displayName}'s Space`,
        invite_code: generateInviteCode(),
        owner_id: user.id,
        invite_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()
    if (hErr) { setError(hErr.message); setLoading(false); return }

    const { error: mErr } = await supabase.from('household_members').insert({
      household_id: household.id,
      user_id: user.id,
      role: 'owner',
      display_name: user.user_metadata?.display_name ?? null,
    })
    if (mErr) { setError(mErr.message); setLoading(false); return }

    router.push('/dashboard')
  }

  const createHousehold = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const code = generateInviteCode()
    const { data: household, error: hErr } = await supabase
      .from('households')
      .insert({ name: householdName, invite_code: code, owner_id: user.id, invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
      .select()
      .single()
    if (hErr) { setError(hErr.message); setLoading(false); return }

    await supabase.from('household_members').insert({
      household_id: household.id,
      user_id: user.id,
      role: 'owner',
      display_name: user.user_metadata?.display_name ?? null,
    })

    router.push('/dashboard')
  }

  const joinHousehold = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('join_household', { p_invite_code: inviteCode.toUpperCase() })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      await router.push('/dashboard')
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  if (mode === 'choose') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 px-4">
        <div className="w-full max-w-md">
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
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 px-4">
      <div className="w-full max-w-sm">
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
    </div>
  )
}
