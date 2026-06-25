'use client'
import { useState } from 'react'
import { Copy, RefreshCw, Check } from 'lucide-react'
import { useHousehold } from '@/providers/HouseholdProvider'
import { createClient } from '@/lib/supabase/client'
import { generateInviteCode } from '@lifestyle/shared'

export default function HouseholdSettingsPage() {
  const { household, members, refresh } = useHousehold()
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

  if (!household) return <div className="p-8 text-stone-400">Loading…</div>

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
