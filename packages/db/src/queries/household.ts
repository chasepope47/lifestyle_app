import { supabase } from '../client'
import type { Database } from '../database.types'

type Household = Database['public']['Tables']['households']['Row']
type HouseholdMember = Database['public']['Tables']['household_members']['Row']

export async function getHousehold(householdId: string): Promise<Household | null> {
  const { data, error } = await supabase
    .from('households')
    .select('*')
    .eq('id', householdId)
    .single()
  if (error) throw error
  return data
}

export async function getMyHousehold(): Promise<Household | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('household_members')
    .select('household_id, households(*)')
    .eq('user_id', user.id)
    .single()
  if (error) return null
  return (data?.households as unknown as Household) ?? null
}

export async function getHouseholdMembers(householdId: string): Promise<HouseholdMember[]> {
  const { data, error } = await supabase
    .from('household_members')
    .select('*')
    .eq('household_id', householdId)
  if (error) throw error
  return data ?? []
}

export async function createHousehold(name: string): Promise<Household> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const inviteCode = generateInviteCode()
  const { data: household, error: hErr } = await supabase
    .from('households')
    .insert({ name, invite_code: inviteCode, owner_id: user.id, invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
    .select()
    .single()
  if (hErr) throw hErr

  const { error: mErr } = await supabase
    .from('household_members')
    .insert({ household_id: household.id, user_id: user.id, role: 'owner' })
  if (mErr) throw mErr

  return household
}

export async function joinHousehold(inviteCode: string): Promise<string> {
  const { data, error } = await supabase.rpc('join_household', { p_invite_code: inviteCode })
  if (error) throw error
  return data as string
}

export async function regenerateInviteCode(householdId: string): Promise<string> {
  const code = generateInviteCode()
  const { error } = await supabase
    .from('households')
    .update({
      invite_code: code,
      invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq('id', householdId)
  if (error) throw error
  return code
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
