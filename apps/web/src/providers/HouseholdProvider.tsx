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
    if (!user) {
      setHousehold(null)
      setMembers([])
      setLoading(false)
      return
    }

    const { data: member } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .single()

    if (!member) {
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
