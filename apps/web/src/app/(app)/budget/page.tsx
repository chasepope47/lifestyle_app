'use client'
import { useEffect, useState } from 'react'
import { Plus, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { useHousehold } from '@/providers/HouseholdProvider'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@lifestyle/shared'
import type { Database } from '@lifestyle/db'

type Account = Database['public']['Tables']['budget_accounts']['Row']
type Transaction = Database['public']['Tables']['transactions']['Row']

export default function BudgetPage() {
  const { householdId } = useHousehold()
  const supabase = createClient()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [accountName, setAccountName] = useState('')
  const [accountType, setAccountType] = useState<Account['type']>('checking')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!householdId) return
    Promise.all([
      supabase.from('budget_accounts').select('*').eq('household_id', householdId).order('name'),
      supabase.from('transactions').select('*').eq('household_id', householdId).order('transaction_date', { ascending: false }).limit(20),
    ]).then(([{ data: accs }, { data: txs }]) => {
      setAccounts(accs ?? [])
      setTransactions(txs ?? [])
      setLoading(false)
    })
  }, [householdId])

  const totalBalance = accounts.filter(a => a.is_shared).reduce((s, a) => s + a.balance, 0)
  const thisMonthIncome = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const thisMonthExpenses = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)

  const addAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!householdId) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('budget_accounts')
      .insert({ household_id: householdId, name: accountName, type: accountType, created_by: user.id })
      .select().single()
    if (data) setAccounts(prev => [...prev, data])
    setShowAddAccount(false)
    setAccountName('')
  }

  if (loading) return <div className="p-8 text-stone-400">Loading…</div>

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Budget</h1>
        <button
          onClick={() => setShowAddAccount(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add account
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5">
          <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-sm mb-2">
            <Wallet className="w-4 h-4" /> Total balance
          </div>
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-50">{formatCurrency(totalBalance)}</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5">
          <div className="flex items-center gap-2 text-green-600 text-sm mb-2">
            <TrendingUp className="w-4 h-4" /> Income
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(thisMonthIncome)}</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5">
          <div className="flex items-center gap-2 text-red-500 text-sm mb-2">
            <TrendingDown className="w-4 h-4" /> Expenses
          </div>
          <p className="text-2xl font-bold text-red-500">{formatCurrency(thisMonthExpenses)}</p>
        </div>
      </div>

      {/* Accounts */}
      <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-3">Accounts</h2>
      {accounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 p-8 text-center text-stone-400">
          No accounts yet. Add your first account to get started.
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {accounts.map(acc => (
            <div key={acc.id} className="flex items-center justify-between rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4">
              <div>
                <p className="font-medium text-stone-900 dark:text-stone-50">{acc.name}</p>
                <p className="text-sm text-stone-500 dark:text-stone-400 capitalize">{acc.type}</p>
              </div>
              <p className={`font-semibold ${acc.balance >= 0 ? 'text-stone-900 dark:text-stone-50' : 'text-red-500'}`}>
                {formatCurrency(acc.balance, acc.currency)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Recent transactions */}
      <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-3">Recent transactions</h2>
      {transactions.length === 0 ? (
        <div className="text-stone-400 text-sm">No transactions yet.</div>
      ) : (
        <div className="space-y-2">
          {transactions.map(tx => (
            <div key={tx.id} className="flex items-center justify-between rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-stone-900 dark:text-stone-50">{tx.description}</p>
                <p className="text-xs text-stone-400">{tx.transaction_date}</p>
              </div>
              <p className={`font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add account modal */}
      {showAddAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-stone-900 dark:text-stone-50 mb-4">Add account</h3>
            <form onSubmit={addAccount} className="space-y-3">
              <input
                value={accountName}
                onChange={e => setAccountName(e.target.value)}
                placeholder="Account name"
                required
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <select
                value={accountType}
                onChange={e => setAccountType(e.target.value as Account['type'])}
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {['checking', 'savings', 'credit', 'cash', 'investment'].map(t => (
                  <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAddAccount(false)} className="flex-1 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-sm font-medium text-stone-700 dark:text-stone-300">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
