import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@lifestyle/db'
import { getExpirationStatus } from '@lifestyle/shared'

function next7Days(): { startDate: string; endDate: string } {
  const now = new Date()
  const startDate = now.toISOString().slice(0, 10)
  const end = new Date(now)
  end.setDate(end.getDate() + 7)
  const endDate = end.toISOString().slice(0, 10)
  return { startDate, endDate }
}

export async function executeReadTool(
  supabase: SupabaseClient<Database>,
  householdId: string,
  name: string,
  input: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case 'get_pantry_items': {
      const status = (input.status as string) || 'active'
      let query = supabase
        .from('pantry_items')
        .select('id, name, category, quantity, unit, price, expiration_date, store')
        .eq('household_id', householdId)
        .order('name')

      if (input.category) query = query.eq('category', input.category as string)
      if (input.search) query = query.ilike('name', `%${input.search as string}%`)

      const { data, error } = await query
      if (error) return { error: error.message }

      // Mirrors the isActive classification in pantry/page.tsx so the assistant's view
      // matches exactly what the user sees in each tab.
      const rows = data ?? []
      const classified = rows.filter(item => {
        if (status === 'all') return true
        const expStatus = getExpirationStatus(item.expiration_date)
        const isEmpty = item.quantity != null && item.quantity <= 0
        return status === 'needs_restock'
          ? isEmpty || ['expired', 'critical', 'soon'].includes(expStatus)
          : !isEmpty && !['expired', 'critical'].includes(expStatus)
      })
      return { items: classified, status }
    }

    case 'get_meal_plans': {
      const { startDate, endDate } = next7Days()
      const start = (input.start_date as string) || startDate
      const end = (input.end_date as string) || endDate

      const { data, error } = await supabase
        .from('meal_plans')
        .select('id, planned_date, meal_type, recipe_name, notes')
        .eq('household_id', householdId)
        .gte('planned_date', start)
        .lte('planned_date', end)
        .order('planned_date')
      if (error) return { error: error.message }
      return { meal_plans: data, range: { start, end } }
    }

    default:
      return { error: `Unknown read tool: ${name}` }
  }
}
