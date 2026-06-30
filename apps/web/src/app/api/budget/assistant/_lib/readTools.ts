import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@lifestyle/db'

function currentMonthBounds(): { startDate: string; endDate: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const startDate = `${y}-${String(m).padStart(2, '0')}-01`
  const endDate = now.toISOString().slice(0, 10)
  return { startDate, endDate }
}

export async function executeReadTool(
  supabase: SupabaseClient<Database>,
  householdId: string,
  name: string,
  input: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case 'get_transactions': {
      const { startDate, endDate } = currentMonthBounds()
      const limit = Math.min(Number(input.limit) || 50, 200)
      let query = supabase
        .from('transactions')
        .select('id, amount, description, merchant, transaction_date, category, category_id, notes')
        .eq('household_id', householdId)
        .order('transaction_date', { ascending: false })
        .limit(limit)

      query = query.gte('transaction_date', (input.start_date as string) || startDate)
      query = query.lte('transaction_date', (input.end_date as string) || endDate)
      if (input.category_id) query = query.eq('category_id', input.category_id as string)
      if (input.search) {
        const term = `%${input.search}%`
        query = query.or(`description.ilike.${term},merchant.ilike.${term}`)
      }

      const { data, error } = await query
      if (error) return { error: error.message }
      return { transactions: data }
    }

    case 'get_categories': {
      const { startDate, endDate } = currentMonthBounds()
      const start = (input.start_date as string) || startDate
      const end = (input.end_date as string) || endDate

      const [catRes, spendRes] = await Promise.all([
        supabase
          .from('budget_categories')
          .select('id, name, color, icon, monthly_limit')
          .eq('household_id', householdId)
          .order('name'),
        supabase
          .from('transactions')
          .select('category_id, amount')
          .eq('household_id', householdId)
          .gte('transaction_date', start)
          .lte('transaction_date', end)
          .lt('amount', 0),
      ])
      if (catRes.error) return { error: catRes.error.message }

      const spendMap: Record<string, number> = {}
      for (const tx of spendRes.data ?? []) {
        if (tx.category_id) spendMap[tx.category_id] = (spendMap[tx.category_id] ?? 0) + Math.abs(tx.amount)
      }
      return {
        categories: (catRes.data ?? []).map(c => ({ ...c, spent: spendMap[c.id] ?? 0 })),
        range: { start, end },
      }
    }

    case 'get_goals': {
      const { data, error } = await supabase
        .from('budget_goals')
        .select('id, name, goal_type, target_amount, current_amount, target_date, category_id, notes, achieved_at')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false })
      if (error) return { error: error.message }
      return { goals: data }
    }

    case 'get_accounts': {
      const { data, error } = await supabase
        .from('budget_accounts')
        .select('id, name, type, balance, currency')
        .eq('household_id', householdId)
        .order('name')
      if (error) return { error: error.message }
      return { accounts: data }
    }

    case 'get_summary': {
      const { startDate, endDate } = currentMonthBounds()
      const start = (input.start_date as string) || startDate
      const end = (input.end_date as string) || endDate

      const { data, error } = await supabase
        .from('transactions')
        .select('amount, category')
        .eq('household_id', householdId)
        .gte('transaction_date', start)
        .lte('transaction_date', end)
      if (error) return { error: error.message }

      const rows = data ?? []
      const income = rows.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
      const expenses = rows.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
      const savings = rows.filter(t => t.category === 'savings').reduce((s, t) => s + Math.abs(t.amount), 0)
      return { range: { start, end }, income, expenses, savings, net: income - expenses }
    }

    default:
      return { error: `Unknown read tool: ${name}` }
  }
}
