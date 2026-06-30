import { supabase } from '../client'
import type { Database } from '../database.types'

type Account = Database['public']['Tables']['budget_accounts']['Row']
type AccountInsert = Database['public']['Tables']['budget_accounts']['Insert']
type Category = Database['public']['Tables']['budget_categories']['Row']
type CategoryInsert = Database['public']['Tables']['budget_categories']['Insert']
type Transaction = Database['public']['Tables']['transactions']['Row']
type TransactionInsert = Database['public']['Tables']['transactions']['Insert']

export async function getAccounts(householdId: string): Promise<Account[]> {
  const { data, error } = await supabase
    .from('budget_accounts')
    .select('*')
    .eq('household_id', householdId)
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function createAccount(account: AccountInsert): Promise<Account> {
  const { data, error } = await supabase.from('budget_accounts').insert(account).select().single()
  if (error) throw error
  return data
}

export async function updateAccountBalance(id: string, balance: number): Promise<void> {
  const { error } = await supabase.from('budget_accounts').update({ balance }).eq('id', id)
  if (error) throw error
}

export async function getCategories(householdId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('budget_categories')
    .select('*')
    .eq('household_id', householdId)
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function createCategory(category: CategoryInsert): Promise<Category> {
  const { data, error } = await supabase.from('budget_categories').insert(category).select().single()
  if (error) throw error
  return data
}

export async function getTransactions(householdId: string, options?: {
  startDate?: string
  endDate?: string
  accountId?: string
  categoryId?: string
  limit?: number
}): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select('*')
    .eq('household_id', householdId)
    .order('transaction_date', { ascending: false })

  if (options?.startDate) query = query.gte('transaction_date', options.startDate)
  if (options?.endDate) query = query.lte('transaction_date', options.endDate)
  if (options?.accountId) query = query.eq('account_id', options.accountId)
  if (options?.categoryId) query = query.eq('category_id', options.categoryId)
  if (options?.limit) query = query.limit(options.limit)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function createTransaction(tx: TransactionInsert): Promise<Transaction> {
  const { data, error } = await supabase.from('transactions').insert(tx).select().single()
  if (error) throw error

  // Update account balance
  const { data: account } = await supabase
    .from('budget_accounts')
    .select('balance')
    .eq('id', tx.account_id)
    .single()
  if (account) {
    await updateAccountBalance(tx.account_id, account.balance + tx.amount)
  }

  return data
}

export async function deleteTransaction(id: string, amount: number, accountId: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw error

  // Reverse balance
  const { data: account } = await supabase
    .from('budget_accounts')
    .select('balance')
    .eq('id', accountId)
    .single()
  if (account) {
    await updateAccountBalance(accountId, account.balance - amount)
  }
}

export async function getMonthlyTrend(
  householdId: string,
  months = 6
): Promise<Array<{ month: string; income: number; expenses: number }>> {
  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth() - (months - 1), 1)
  const startDate = start.toISOString().slice(0, 10)
  const endDate = end.toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, transaction_date')
    .eq('household_id', householdId)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)

  if (error) throw error

  const map: Record<string, { income: number; expenses: number }> = {}
  for (const tx of data ?? []) {
    const key = tx.transaction_date.slice(0, 7)
    if (!map[key]) map[key] = { income: 0, expenses: 0 }
    if (tx.amount > 0) map[key].income += tx.amount
    else map[key].expenses += Math.abs(tx.amount)
  }

  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, totals]) => ({ month, ...totals }))
}

export async function getSpendingByGranularCategory(
  householdId: string,
  startDate: string,
  endDate: string
): Promise<Array<{
  id: string
  name: string
  color: string | null
  icon: string | null
  monthly_limit: number | null
  spent: number
}>> {
  const [txData, catData] = await Promise.all([
    supabase
      .from('transactions')
      .select('category_id, amount')
      .eq('household_id', householdId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .lt('amount', 0),
    supabase
      .from('budget_categories')
      .select('*')
      .eq('household_id', householdId)
      .order('name'),
  ])

  if (txData.error) throw txData.error
  if (catData.error) throw catData.error

  const spendMap: Record<string, number> = {}
  for (const tx of txData.data ?? []) {
    if (tx.category_id) {
      spendMap[tx.category_id] = (spendMap[tx.category_id] ?? 0) + Math.abs(tx.amount)
    }
  }

  return (catData.data ?? []).map(cat => ({
    id: cat.id,
    name: cat.name,
    color: cat.color,
    icon: cat.icon,
    monthly_limit: cat.monthly_limit,
    spent: spendMap[cat.id] ?? 0,
  }))
}

export async function getMonthlySpendingByCategory(householdId: string, year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().slice(0, 10)
  const transactions = await getTransactions(householdId, { startDate, endDate })

  const map: Record<string, number> = {}
  for (const tx of transactions) {
    if (tx.amount < 0) {
      const key = tx.category_id ?? 'uncategorized'
      map[key] = (map[key] ?? 0) + Math.abs(tx.amount)
    }
  }
  return map
}
