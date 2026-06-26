'use client'
import { useEffect, useState, useRef } from 'react'
import { Plus, ChevronDown, ChevronLeft, ChevronRight, Meh, Frown, Smile, MoreHorizontal, ArrowLeft, Settings, X, Upload, Link2 } from 'lucide-react'
import { useHousehold } from '@/providers/HouseholdProvider'
import { useAuth } from '@/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@lifestyle/shared'
import type { Database } from '@lifestyle/db'

type Account = Database['public']['Tables']['budget_accounts']['Row']
type Transaction = Database['public']['Tables']['transactions']['Row']
type SwipeDirection = 'up' | 'down' | 'left' | 'right'
type SwipeConfig = Record<SwipeDirection, string>

const CATEGORY_COLORS = {
  needs: { bg: 'bg-blue-500', light: 'bg-blue-500/20', text: 'text-blue-400' },
  wants: { bg: 'bg-yellow-500', light: 'bg-yellow-500/20', text: 'text-yellow-400' },
  savings: { bg: 'bg-green-500', light: 'bg-green-500/20', text: 'text-green-400' },
  transfers: { bg: 'bg-purple-500', light: 'bg-purple-500/20', text: 'text-purple-400' },
}

const TRANSACTION_CATEGORIES = [
  'Debt Payments', 'Shopping', 'Travel', 'Dining Out', 'Entertainment',
  'Groceries', 'Utilities', 'Gas', 'Insurance', 'Healthcare'
]

export default function BudgetPage() {
  const { householdId } = useHousehold()
  const { user } = useAuth()
  const supabase = createClient()
  const [view, setView] = useState<'dashboard' | 'review'>('dashboard')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [reviewIndex, setReviewIndex] = useState(0)
  const [unreviewed, setUnreviewed] = useState<Transaction[]>([])
  const [swipeConfig, setSwipeConfig] = useState<SwipeConfig>({
    up: 'needs',
    down: 'savings',
    left: 'wants',
    right: 'transfers',
  })
  const [showSwipeSettings, setShowSwipeSettings] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection | null>(null)
  const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 })
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [accountForm, setAccountForm] = useState<{ name: string; type: 'checking' | 'savings' | 'credit' | 'cash' | 'investment'; balance: string; currency: string }>({ name: '', type: 'checking', balance: '', currency: 'USD' })
  const [statementFile, setStatementFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

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
    transfers: monthTransactions.filter(t => t.category === 'transfers' && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
  }

  const totalCategorySpending = categorySpending.needs + categorySpending.wants + categorySpending.savings
  const categoryPercentages = {
    needs: totalCategorySpending > 0 ? (categorySpending.needs / totalCategorySpending) * 100 : 0,
    wants: totalCategorySpending > 0 ? (categorySpending.wants / totalCategorySpending) * 100 : 0,
    savings: totalCategorySpending > 0 ? (categorySpending.savings / totalCategorySpending) * 100 : 0,
  }

  const updateTransactionCategory = async (txId: string, category: string, emotion?: string) => {
    const { error } = await supabase.from('transactions').update({ category, emotion }).eq('id', txId)
    if (error) {
      console.error('Failed to update transaction:', error)
      return
    }
    const newUnreviewed = unreviewed.filter(t => t.id !== txId)
    setSwipeDirection(null)
    setSwipeOffset({ x: 0, y: 0 })
    setUnreviewed(newUnreviewed)
    if (newUnreviewed.length > 0) {
      if (reviewIndex >= newUnreviewed.length) {
        setReviewIndex(newUnreviewed.length - 1)
      }
    } else {
      setView('dashboard')
    }
  }

  const saveAccount = async () => {
    if (!householdId || !user) return
    try {
      if (editingAccount) {
        await supabase.from('budget_accounts').update({
          name: accountForm.name,
          type: accountForm.type,
          balance: parseFloat(accountForm.balance),
          currency: accountForm.currency,
        }).eq('id', editingAccount.id)
      } else {
        await supabase.from('budget_accounts').insert({
          household_id: householdId,
          name: accountForm.name,
          type: accountForm.type,
          balance: parseFloat(accountForm.balance),
          currency: accountForm.currency,
          created_by: user.id,
        })
      }
      setAccounts(prev => {
        if (editingAccount) {
          return prev.map(a => a.id === editingAccount.id ? { ...a, ...accountForm, balance: parseFloat(accountForm.balance) } : a)
        }
        return prev
      })
      setShowAddAccount(false)
      setEditingAccount(null)
      setAccountForm({ name: '', type: 'checking', balance: '', currency: 'USD' })
    } catch (err) {
      console.error('Error saving account:', err)
    }
  }

  const openEditAccount = (account: Account) => {
    setEditingAccount(account)
    setAccountForm({
      name: account.name,
      type: account.type,
      balance: account.balance.toString(),
      currency: account.currency || 'USD',
    })
    setStatementFile(null)
    setShowAddAccount(true)
  }

  const isExactDuplicate = async (accountId: string, amount: number, description: string, transactionDate: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('transactions')
      .select('id')
      .eq('account_id', accountId)
      .eq('amount', amount)
      .eq('description', description)
      .eq('transaction_date', transactionDate)
      .limit(1)

    if (error) {
      console.error('Error checking duplicate:', error)
      return false
    }

    return (data?.length ?? 0) > 0
  }

  const parseCSVTransactions = async (file: File, accountId: string) => {
    const text = await file.text()
    const lines = text.split('\n')
    if (lines.length < 2) throw new Error('CSV file is empty')

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    const dateIdx = headers.findIndex(h => h === 'Posting Date')
    const amountIdx = headers.findIndex(h => h === 'Amount')
    const descIdx = headers.findIndex(h => h === 'Description')

    if (dateIdx === -1 || amountIdx === -1 || descIdx === -1) {
      throw new Error('CSV missing required columns: Posting Date, Amount, Description')
    }

    const transactions = []
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue

      const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
      const date = cols[dateIdx]
      const amount = parseFloat(cols[amountIdx])
      const description = cols[descIdx]

      if (!date || isNaN(amount) || !description) continue

      const isDup = await isExactDuplicate(accountId, amount, description, date)
      if (!isDup) {
        transactions.push({
          account_id: accountId,
          amount,
          description,
          transaction_date: date,
          merchant: cols[headers.findIndex(h => h === 'Extended Description')] || undefined,
          notes: cols[headers.findIndex(h => h === 'Transaction Category')] || undefined,
        })
      }
    }

    return transactions
  }

  const uploadStatement = async () => {
    if (!statementFile || !editingAccount || !user || !householdId) return
    try {
      const fileName = `${editingAccount.id}/${Date.now()}-${statementFile.name}`
      const { error } = await supabase.storage.from('bank_statements').upload(fileName, statementFile)
      if (error) throw error

      let importCount = 0
      if (statementFile.name.endsWith('.csv')) {
        const newTransactions = await parseCSVTransactions(statementFile, editingAccount.id)
        if (newTransactions.length > 0 && householdId && user?.id) {
          const validTransactions = newTransactions.map(t => ({
            ...t,
            household_id: householdId,
            user_id: user.id,
          }))
          const { error: insertError } = await supabase.from('transactions').insert(validTransactions)
          if (insertError) throw insertError
          importCount = newTransactions.length
        }
        alert(`Bank statement imported!\n${importCount} new transactions added.`)
      } else {
        alert('Bank statement uploaded successfully! (CSV import adds transactions automatically)')
      }

      setStatementFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      console.error('Error uploading statement:', err)
      alert(`Failed to upload bank statement: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    setSwipeDirection(null)
    setSwipeOffset({ x: 0, y: 0 })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    const diffX = currentX - touchStartRef.current.x
    const diffY = currentY - touchStartRef.current.y
    setSwipeOffset({ x: diffX, y: diffY })
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    const endX = e.changedTouches[0].clientX
    const endY = e.changedTouches[0].clientY
    const diffX = endX - touchStartRef.current.x
    const diffY = endY - touchStartRef.current.y
    const minSwipeDistance = 50

    setSwipeOffset({ x: 0, y: 0 })

    if (Math.abs(diffX) < minSwipeDistance && Math.abs(diffY) < minSwipeDistance) return

    let direction: SwipeDirection | null = null
    if (Math.abs(diffX) > Math.abs(diffY)) {
      direction = diffX > 0 ? 'right' : 'left'
    } else {
      direction = diffY > 0 ? 'down' : 'up'
    }

    if (direction && swipeConfig[direction]) {
      setSwipeDirection(direction)
      const category = swipeConfig[direction]
      const current = unreviewed[reviewIndex]
      if (current) {
        setTimeout(() => {
          updateTransactionCategory(current.id, category)
        }, 200)
      }
    }
  }

  if (loading) return <div className="p-8 text-stone-400">Loading…</div>

  if (view === 'review' && unreviewed.length > 0) {
    const current = unreviewed[reviewIndex]
    return (
      <div className="px-3 sm:px-4 py-6 sm:py-8 max-w-2xl mx-auto pb-20">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => setView('dashboard')} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-stone-600 dark:text-stone-400" />
          </button>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">Review Transactions</h1>
          <button onClick={() => setShowSwipeSettings(true)} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg">
            <Settings className="w-5 h-5 text-stone-600 dark:text-stone-400" />
          </button>
        </div>

        <div className="text-center mb-8">
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-2">
            {new Date(current.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(current.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
          </p>
        </div>

        {/* Swipeable transaction card */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`rounded-2xl border border-stone-700 dark:border-stone-700 bg-stone-900/50 dark:bg-stone-800/50 p-4 sm:p-6 mb-8 ${
            swipeDirection ? 'transition-all' : ''
          } cursor-grab active:cursor-grabbing touch-none`}
          style={{
            transform: swipeDirection
              ? (swipeDirection === 'up' ? 'scale(0.95)' : swipeDirection === 'down' ? 'scale(0.95)' :
                 swipeDirection === 'left' ? 'translateX(48px)' : 'translateX(-48px)') + ' opacity(0.7)'
              : `translateX(${swipeOffset.x * 0.5}px) translateY(${swipeOffset.y * 0.5}px)`
          }}
        >
          <div className="flex gap-3 sm:gap-4 mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm sm:text-lg">
              {(current.description || 'TX').substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg sm:text-xl font-semibold text-stone-50 truncate">{current.description}</p>
              <p className="text-xl sm:text-2xl font-bold text-white mt-2">{formatCurrency(Math.abs(current.amount))}</p>
            </div>
          </div>

          <p className="text-center text-sm text-stone-400 mb-4">Swipe to categorize</p>

          {/* Swipe guides */}
          <div className="grid grid-cols-4 gap-2 text-xs sm:text-sm text-center">
            <div className="p-2 sm:p-3 rounded-lg bg-stone-700/50">
              <div className="text-base sm:text-lg mb-1">⬆️</div>
              <div className="font-medium text-stone-300 text-xs">{swipeConfig.up || 'Not set'}</div>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-stone-700/50">
              <div className="text-base sm:text-lg mb-1">⬅️</div>
              <div className="font-medium text-stone-300 text-xs">{swipeConfig.left || 'Not set'}</div>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-stone-700/50">
              <div className="text-base sm:text-lg mb-1">➡️</div>
              <div className="font-medium text-stone-300 text-xs">{swipeConfig.right || 'Not set'}</div>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-stone-700/50">
              <div className="text-base sm:text-lg mb-1">⬇️</div>
              <div className="font-medium text-stone-300 text-xs">{swipeConfig.down || 'Not set'}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
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

        {/* Swipe Settings Modal */}
        {showSwipeSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-stone-900 rounded-2xl p-6 w-full max-w-sm">
              <h2 className="text-lg font-semibold text-stone-50 mb-6">Configure Swipe Gestures</h2>

              <div className="space-y-4">
                {(['up', 'down', 'left', 'right'] as SwipeDirection[]).map(dir => (
                  <div key={dir}>
                    <label className="block text-sm font-medium text-stone-300 mb-2">
                      {dir === 'up' ? '⬆️ Swipe Up' : dir === 'down' ? '⬇️ Swipe Down' : dir === 'left' ? '⬅️ Swipe Left' : '➡️ Swipe Right'}
                    </label>
                    <select
                      value={swipeConfig[dir]}
                      onChange={(e) => setSwipeConfig(p => ({ ...p, [dir]: e.target.value }))}
                      className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-2.5 text-stone-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Not assigned</option>
                      <option value="needs">Needs</option>
                      <option value="wants">Wants</option>
                      <option value="savings">Savings</option>
                    </select>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowSwipeSettings(false)}
                className="w-full mt-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="px-3 sm:px-4 py-6 sm:py-8 max-w-6xl mx-auto pb-20">
      {/* Safe to spend */}
      <div className="rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-600 p-6 sm:p-8 mb-8 text-center">
        <p className="text-teal-100 text-xs sm:text-sm mb-2">safe to spend</p>
        <p className="text-3xl sm:text-5xl font-bold text-white mb-3">{formatCurrency(safeToSpend)}</p>
        <p className="text-teal-100 text-xs sm:text-sm">this month</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl bg-stone-800 dark:bg-stone-900 border border-stone-700 dark:border-stone-800 p-4 text-center">
          <p className="text-sm text-stone-400 mb-1">Income</p>
          <p className="text-2xl font-bold text-stone-50">{formatCurrency(income)}</p>
        </div>
        <div className="rounded-2xl bg-stone-800 dark:bg-stone-900 border border-stone-700 dark:border-stone-800 p-4 text-center">
          <p className="text-sm text-stone-400 mb-1">Fixed Spend</p>
          <p className="text-2xl font-bold text-stone-50">{formatCurrency(expenses * 0.3)}</p>
        </div>
        <div className="rounded-2xl bg-stone-800 dark:bg-stone-900 border border-stone-700 dark:border-stone-800 p-4 text-center">
          <p className="text-sm text-stone-400 mb-1">Savings</p>
          <p className="text-2xl font-bold text-stone-50">{formatCurrency(income - expenses)}</p>
        </div>
      </div>

      {/* Spending breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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
                  <div className={`w-10 h-10 rounded-lg ${catColor.bg} flex-shrink-0 flex items-center justify-center text-white font-bold text-sm`}>
                    {(tx.description || 'TX').substring(0, 2).toUpperCase()}
                  </div>
                  <button className="p-1 hover:bg-stone-700/50 rounded flex-shrink-0 ml-2">
                    <MoreHorizontal className="w-4 h-4 text-stone-500" />
                  </button>
                </div>
                <p className="text-sm font-medium text-stone-50 mb-1 truncate">{tx.description}</p>
                <p className="text-xl sm:text-2xl font-bold text-white mb-2">{formatCurrency(Math.abs(tx.amount))}</p>
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
          <button onClick={() => { setShowAddAccount(true); setEditingAccount(null); setAccountForm({ name: '', type: 'checking', balance: '', currency: 'USD' }); }} className="flex items-center gap-2 px-3 py-1 text-blue-400 hover:text-blue-300 text-sm font-medium">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <div className="space-y-2">
          {accounts.map(acc => (
            <button key={acc.id} onClick={() => openEditAccount(acc)} className="w-full text-left flex items-center justify-between rounded-xl bg-stone-800 dark:bg-stone-900 border border-stone-700 dark:border-stone-800 p-4 hover:border-stone-600 dark:hover:border-stone-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-stone-700 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div>
                  <p className="font-medium text-stone-50">{acc.name}</p>
                  <p className="text-xs text-stone-400">{acc.type} · {acc.currency || 'USD'}</p>
                </div>
              </div>
              <p className="font-semibold text-stone-50">{formatCurrency(acc.balance)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Add/Edit Account Modal */}
      {showAddAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-stone-900 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-stone-50">{editingAccount ? 'Edit Account' : 'Add Account'}</h3>
              <button onClick={() => { setShowAddAccount(false); setEditingAccount(null); }} className="p-1 hover:bg-stone-800 rounded">
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">Account Name</label>
                <input
                  type="text"
                  value={accountForm.name}
                  onChange={e => setAccountForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Checking, Savings"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-600 bg-stone-800 text-stone-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">Type</label>
                <select
                  value={accountForm.type}
                  onChange={e => setAccountForm(p => ({ ...p, type: e.target.value as 'checking' | 'savings' | 'credit' | 'cash' | 'investment' }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-600 bg-stone-800 text-stone-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit">Credit Card</option>
                  <option value="cash">Cash</option>
                  <option value="investment">Investment</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={accountForm.balance}
                    onChange={e => setAccountForm(p => ({ ...p, balance: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-600 bg-stone-800 text-stone-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">Currency</label>
                  <input
                    type="text"
                    value={accountForm.currency}
                    onChange={e => setAccountForm(p => ({ ...p, currency: e.target.value.toUpperCase() }))}
                    placeholder="USD"
                    maxLength={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-600 bg-stone-800 text-stone-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={saveAccount}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors mb-2"
            >
              {editingAccount ? 'Update Account' : 'Create Account'}
            </button>

            {editingAccount && (
              <>
                <div className="my-6 border-t border-stone-700" />

                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-stone-300 mb-3">Bank Statements</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-600 bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm font-medium transition-colors"
                    >
                      <Upload className="w-4 h-4" /> Upload Statement
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.csv,.xlsx,.xls"
                      onChange={e => setStatementFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </div>
                  {statementFile && (
                    <div className="mt-2 p-3 bg-stone-800 rounded-lg flex items-center justify-between">
                      <span className="text-xs text-stone-300 truncate">{statementFile.name}</span>
                      <button
                        onClick={uploadStatement}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors"
                      >
                        Upload
                      </button>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-stone-300 mb-3">Connect Bank Account</h4>
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-600 bg-stone-800 text-stone-400 text-sm font-medium cursor-not-allowed opacity-50">
                    <Link2 className="w-4 h-4" /> Connect with Plaid
                  </button>
                  <p className="text-xs text-stone-500 mt-2">Coming soon - automatically sync transactions from your bank</p>
                </div>
              </>
            )}

            <button
              onClick={() => { setShowAddAccount(false); setEditingAccount(null); }}
              className="w-full py-2 rounded-xl border border-stone-600 text-stone-300 font-medium hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
