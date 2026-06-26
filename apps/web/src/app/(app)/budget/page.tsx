'use client'
import { useEffect, useState } from 'react'
import { Plus, ChevronDown, ChevronLeft, ChevronRight, Meh, Frown, Smile, MoreHorizontal, ArrowLeft } from 'lucide-react'
import { useHousehold } from '@/providers/HouseholdProvider'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@lifestyle/shared'
import type { Database } from '@lifestyle/db'

type Account = Database['public']['Tables']['budget_accounts']['Row']
type Transaction = Database['public']['Tables']['transactions']['Row']

const CATEGORY_COLORS = {
  needs: { bg: 'bg-blue-500', light: 'bg-blue-500/20', text: 'text-blue-400' },
  wants: { bg: 'bg-yellow-500', light: 'bg-yellow-500/20', text: 'text-yellow-400' },
  savings: { bg: 'bg-green-500', light: 'bg-green-500/20', text: 'text-green-400' },
}

const TRANSACTION_CATEGORIES = [
  'Debt Payments', 'Shopping', 'Travel', 'Dining Out', 'Entertainment',
  'Groceries', 'Utilities', 'Gas', 'Insurance', 'Healthcare'
]

export default function BudgetPage() {
  const { householdId } = useHousehold()
  const supabase = createClient()
  const [view, setView] = useState<'dashboard' | 'review'>('dashboard')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [reviewIndex, setReviewIndex] = useState(0)
  const [unreviewed, setUnreviewed] = useState<Transaction[]>([])

  useEffect(() => {
    if (!householdId) return
    Promise.all([
      supabase.from('budget_accounts').select('*').eq('household_id', householdId).order('name'),
      supabase.from('transactions').select('*').eq('household_id', householdId).order('transaction_date', { ascending: false }).limit(50),
    ]).then(([{ data: accs }, { data: txs }]) => {
      setAccounts(accs ?? [])
      const sorted = (txs ?? []).sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
      setTransactions(sorted)
      setUnreviewed(sorted.filter(t => !t.category))
      setLoading(false)
    })
  }, [householdId])

  const monthTransactions = transactions.filter(t => {
    const txDate = new Date(t.transaction_date)
    return txDate.getMonth() === currentMonth.getMonth() && txDate.getFullYear() === currentMonth.getFullYear()
  })

  const income = monthTransactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const expenses = monthTransactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
  const safeToSpend = Math.max(0, income - expenses)

  const categorySpending = {
    needs: monthTransactions.filter(t => t.category === 'needs' && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
    wants: monthTransactions.filter(t => t.category === 'wants' && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
    savings: monthTransactions.filter(t => t.category === 'savings' && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
  }

  const totalCategorySpending = categorySpending.needs + categorySpending.wants + categorySpending.savings
  const categoryPercentages = {
    needs: totalCategorySpending > 0 ? (categorySpending.needs / totalCategorySpending) * 100 : 0,
    wants: totalCategorySpending > 0 ? (categorySpending.wants / totalCategorySpending) * 100 : 0,
    savings: totalCategorySpending > 0 ? (categorySpending.savings / totalCategorySpending) * 100 : 0,
  }

  const updateTransactionCategory = async (txId: string, category: string, emotion?: string) => {
    await supabase.from('transactions').update({ category, emotion }).eq('id', txId)
    setUnreviewed(prev => prev.filter(t => t.id !== txId))
    if (reviewIndex < unreviewed.length - 1) {
      setReviewIndex(reviewIndex + 1)
    } else {
      setView('dashboard')
    }
  }

  if (loading) return <div className="p-8 text-stone-400">Loading…</div>

  if (view === 'review' && unreviewed.length > 0) {
    const current = unreviewed[reviewIndex]
    return (
      <div className="px-4 py-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => setView('dashboard')} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-stone-600 dark:text-stone-400" />
          </button>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">Review Transactions</h1>
          <div className="w-10" />
        </div>

        <div className="text-center mb-8">
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-2">
            {new Date(current.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(current.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-700 dark:border-stone-700 bg-stone-900/50 dark:bg-stone-800/50 p-6 mb-6">
          <div className="flex gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
              {(current.description || 'TX').substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-xl font-semibold text-stone-50">{current.description}</p>
              <p className="text-2xl font-bold text-white mt-2">{formatCurrency(Math.abs(current.amount))}</p>
            </div>
          </div>

          <div className="flex gap-2 justify-center mb-6">
            <button
              onClick={() => updateTransactionCategory(current.id, '', 'sad')}
              className="flex flex-col items-center gap-2 p-3 hover:bg-stone-700 rounded-lg transition-colors"
            >
              <Frown className="w-6 h-6 text-red-400" />
              <span className="text-xs text-stone-400">Regret</span>
            </button>
            <button
              onClick={() => updateTransactionCategory(current.id, '', 'neutral')}
              className="flex flex-col items-center gap-2 p-3 hover:bg-stone-700 rounded-lg transition-colors"
            >
              <Meh className="w-6 h-6 text-yellow-400" />
              <span className="text-xs text-stone-400">Neutral</span>
            </button>
            <button
              onClick={() => updateTransactionCategory(current.id, '', 'happy')}
              className="flex flex-col items-center gap-2 p-3 hover:bg-stone-700 rounded-lg transition-colors"
            >
              <Smile className="w-6 h-6 text-green-400" />
              <span className="text-xs text-stone-400">Happy</span>
            </button>
          </div>

          <select
            onChange={(e) => updateTransactionCategory(current.id, e.target.value)}
            className="w-full rounded-lg border border-stone-600 dark:border-stone-700 bg-stone-800 dark:bg-stone-900 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select category…</option>
            <option value="needs">Needs</option>
            <option value="wants">Wants</option>
            <option value="savings">Savings</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setReviewIndex(Math.max(0, reviewIndex - 1))}
            disabled={reviewIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-stone-400 disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" /> Undo
          </button>
          <p className="text-sm text-stone-400">{reviewIndex + 1} of {unreviewed.length}</p>
          <button onClick={() => {
            if (reviewIndex < unreviewed.length - 1) setReviewIndex(reviewIndex + 1)
            else setView('dashboard')
          }}
            className="flex items-center gap-2 px-4 py-2 text-blue-400"
          >
            Skip <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-8 max-w-6xl mx-auto pb-20">
      {/* Safe to spend */}
      <div className="rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-600 p-8 mb-8 text-center">
        <p className="text-teal-100 text-sm mb-2">safe to spend</p>
        <p className="text-5xl font-bold text-white mb-3">{formatCurrency(safeToSpend)}</p>
        <p className="text-teal-100 text-sm">this month</p>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
          <ChevronLeft className="w-5 h-5 text-stone-600 dark:text-stone-400" />
        </button>
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
          <ChevronRight className="w-5 h-5 text-stone-600 dark:text-stone-400" />
        </button>
      </div>

      {/* Monthly averages */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl bg-stone-800 dark:bg-stone-900 border border-stone-700 dark:border-stone-800 p-4">
          <p className="text-sm text-stone-400 mb-1">Income</p>
          <p className="text-2xl font-bold text-stone-50">{formatCurrency(income)}</p>
        </div>
        <div className="rounded-2xl bg-stone-800 dark:bg-stone-900 border border-stone-700 dark:border-stone-800 p-4">
          <p className="text-sm text-stone-400 mb-1">Fixed Spend</p>
          <p className="text-2xl font-bold text-stone-50">{formatCurrency(expenses * 0.3)}</p>
        </div>
        <div className="rounded-2xl bg-stone-800 dark:bg-stone-900 border border-stone-700 dark:border-stone-800 p-4">
          <p className="text-sm text-stone-400 mb-1">Savings</p>
          <p className="text-2xl font-bold text-stone-50">{formatCurrency(income - expenses)}</p>
        </div>
      </div>

      {/* Spending breakdown */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="rounded-2xl bg-stone-800 dark:bg-stone-900 border border-stone-700 dark:border-stone-800 p-6">
          <h3 className="font-semibold text-stone-50 mb-4">Spending Breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-stone-300">Needs</span>
              </div>
              <span className="text-stone-50 font-semibold">{categoryPercentages.needs.toFixed(0)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-stone-300">Wants</span>
              </div>
              <span className="text-stone-50 font-semibold">{categoryPercentages.wants.toFixed(0)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-stone-300">Savings</span>
              </div>
              <span className="text-stone-50 font-semibold">{categoryPercentages.savings.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-stone-800 dark:bg-stone-900 border border-stone-700 dark:border-stone-800 p-6">
          <h3 className="font-semibold text-stone-50 mb-4">Category Spending</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-stone-300">Needs</span>
                <span className="text-stone-50">{formatCurrency(categorySpending.needs)}</span>
              </div>
              <div className="h-2 bg-stone-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${categoryPercentages.needs}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-stone-300">Wants</span>
                <span className="text-stone-50">{formatCurrency(categorySpending.wants)}</span>
              </div>
              <div className="h-2 bg-stone-700 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500" style={{ width: `${categoryPercentages.wants}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-stone-300">Savings</span>
                <span className="text-stone-50">{formatCurrency(categorySpending.savings)}</span>
              </div>
              <div className="h-2 bg-stone-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${categoryPercentages.savings}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-stone-50">Recent Transactions</h3>
          {unreviewed.length > 0 && (
            <button
              onClick={() => setView('review')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              Review {unreviewed.length}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {monthTransactions.slice(0, 12).map(tx => {
            const catColor = tx.category ? CATEGORY_COLORS[tx.category as keyof typeof CATEGORY_COLORS] : { bg: 'bg-stone-700', light: 'bg-stone-700/20', text: 'text-stone-400' }
            return (
              <div key={tx.id} className={`rounded-xl border border-stone-700 dark:border-stone-700 p-4 ${catColor.light}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg ${catColor.bg} flex items-center justify-center text-white font-bold text-sm`}>
                    {(tx.description || 'TX').substring(0, 2).toUpperCase()}
                  </div>
                  <button className="p-1 hover:bg-stone-700/50 rounded">
                    <MoreHorizontal className="w-4 h-4 text-stone-500" />
                  </button>
                </div>
                <p className="text-sm font-medium text-stone-50 mb-1">{tx.description}</p>
                <p className="text-2xl font-bold text-white mb-2">{formatCurrency(Math.abs(tx.amount))}</p>
                <p className="text-xs text-stone-400">{new Date(tx.transaction_date).toLocaleDateString()}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Accounts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-stone-50">Accounts</h3>
          <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">Add Account</button>
        </div>
        <div className="space-y-2">
          {accounts.map(acc => (
            <div key={acc.id} className="flex items-center justify-between rounded-xl bg-stone-800 dark:bg-stone-900 border border-stone-700 dark:border-stone-800 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-stone-700 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div>
                  <p className="font-medium text-stone-50">{acc.name}</p>
                  <p className="text-xs text-stone-400">{acc.currency || 'USD'}</p>
                </div>
              </div>
              <p className="font-semibold text-stone-50">{formatCurrency(acc.balance)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
