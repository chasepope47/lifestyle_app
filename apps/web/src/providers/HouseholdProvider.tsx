'use client'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generateInviteCode } from '@lifestyle/shared'
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
  refresh: () => Promise<void>
}

const HouseholdContext = createContext<HouseholdContextValue>({
  household: null,
  members: [],
  partner: null,
  householdId: null,
  loading: true,
  refresh: async () => {},
})

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const supabase = createClient()
  const [household, setHousehold] = useState<Household | null>(null)
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
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
        // No household yet — create a personal one so all features work immediately.
        // User can invite a partner from settings whenever they're ready.
        const displayName =
          (user.user_metadata?.display_name as string | undefined) ??
          user.email?.split('@')[0] ??
          'My'
        const { data: newHousehold } = await supabase
          .from('households')
          .insert({
            name: `${displayName}'s Space`,
            invite_code: generateInviteCode(),
            owner_id: user.id,
            invite_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .select()
          .single()

        if (newHousehold) {
          await supabase.from('household_members').insert({
            household_id: newHousehold.id,
            user_id: user.id,
            role: 'owner',
            display_name: (user.user_metadata?.display_name as string | undefined) ?? null,
          })
          setHousehold(newHousehold)
          setMembers([])
        } else {
          setHousehold(null)
          setMembers([])
        }
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
    } catch (error) {
      console.error('Error loading household:', error)
      setHousehold(null)
      setMembers([])
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [user])

  const partner = members.find(m => m.user_id !== user?.id) ?? null
  const householdId = household?.id ?? null

  return (
    <HouseholdContext.Provider value={{ household, members, partner, householdId, loading, refresh: load }}>
      {children}
    </HouseholdContext.Provider>
  )
}

export const useHousehold = () => useContext(HouseholdContext)
