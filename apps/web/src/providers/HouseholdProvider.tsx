'use client'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@lifestyle/db'
import { useAuth } from './AuthProvider'

type Household = Database['public']['Tables']['households']['Row']
type HouseholdMember = Database['public']['Tables']['household_members']['Row']

interface HouseholdContextValue {
  household: Household | null
  members: HouseholdMember[]
  partner: HouseholdMember | null
  householdId: string | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const HouseholdContext = createContext<HouseholdContextValue>({
  household: null,
  members: [],
  partner: null,
  householdId: null,
  loading: true,
  error: null,
  refresh: async () => {},
})

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const supabase = createClient()
  const [household, setHousehold] = useState<Household | null>(null)
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      setError(null)
      if (!user) {
        setHousehold(null)
        setMembers([])
        setLoading(false)
        return
      }

      const { data: member, error: memberError } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .single()

      if (memberError || !member) {
        // No household yet. Households are only created when a user explicitly
        // creates or joins one from /household/settings — nothing to load here.
        setHousehold(null)
        setMembers([])
        setLoading(false)
        return
      }

      const [{ data: hh }, { data: mems }] = await Promise.all([
        supabase.from('households').select('*').eq('id', member.household_id).single(),
        supabase.from('household_members').select('*').eq('household_id', member.household_id),
      ])

      setHousehold(hh ?? null)
      setMembers(mems ?? [])
      setLoading(false)
    } catch (err) {
      console.error('Error loading household:', err)
      setHousehold(null)
      setMembers([])
      setError("We couldn't set up your household. Please try refreshing the page.")
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [user])

  const partner = members.find(m => m.user_id !== user?.id) ?? null
  const householdId = household?.id ?? null

  return (
    <HouseholdContext.Provider value={{ household, members, partner, householdId, loading, error, refresh: load }}>
      {error && (
        <div className="fixed top-0 inset-x-0 z-50 bg-red-600 text-white text-sm px-4 py-2 flex items-center justify-center gap-3">
          <span>{error}</span>
          <button onClick={load} className="underline font-medium hover:no-underline">
            Retry
          </button>
        </div>
      )}
      {children}
    </HouseholdContext.Provider>
  )
}

export const useHousehold = () => useContext(HouseholdContext)
