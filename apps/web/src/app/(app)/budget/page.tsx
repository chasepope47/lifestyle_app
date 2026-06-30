'use client'
import { useEffect, useState, useRef } from 'react'
import { Plus } from 'lucide-react'
import dynamic from 'next/dynamic'
import { ModulePage } from '@/components/layout/ModulePage'
import { useHousehold } from '@/providers/HouseholdProvider'
import { useAuth } from '@/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@lifestyle/db'
import { MonthSelector } from './_components/MonthSelector'
import { BudgetHeroRing } from './_components/BudgetHeroRing'
import { MonthlySummaryStrip } from './_components/MonthlySummaryStrip'
import { ReviewView } from './_components/ReviewView'
import { AccountsPanel } from './_components/AccountsPanel'
import { CategoryEnvelopeGrid, type EnvelopeCategory } from './_components/CategoryEnvelopeGrid'
import { TransactionList } from './_components/TransactionList'
import { QuickAddTransaction } from './_components/QuickAddTransaction'

const SpendingDonut = dynamic(
  () => import('./_components/SpendingDonut').then(m => ({ default: m.SpendingDonut })),
  { ssr: false, loading: () => <div className="h-48 rounded-2xl bg-stone-100 dark:bg-stone-800 animate-pulse" /> }
)
const SpendingTrendChart = dynamic(
  () => import('./_components/SpendingTrendChart').then(m => ({ default: m.SpendingTrendChart })),
  { ssr: false, loading: () => <div className="h-52 rounded-2xl bg-stone-100 dark:bg-stone-800 animate-pulse mb-6" /> }
)

type Account = Database['public']['Tables']['budget_accounts']['Row']
type Transaction = Database['public']['Tables']['transactions']['Row']

interface AccountForm {
  name: string
  type: 'checking' | 'savings' | 'credit' | 'cash' | 'investment'
  balance: string
  currency: string
}

interface TrendDataPoint {
  month: string
  income: number
  expenses: number
}

function monthBounds(date: Date): { startDate: string; endDate: string } {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const startDate = `${y}-${String(m).padStart(2, '0')}-01`
  const endDate = new Date(y, m, 0).toISOString().slice(0, 10)
  return { startDate, endDate }
}

export default function BudgetPage() {
  const { householdId } = useHousehold()
  const { user } = useAuth()
  const supabase = createClient()

  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [envelopeCategories, setEnvelopeCategories] = useState<EnvelopeCategory[]>([])
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'dashboard' | 'review'>('dashboard')
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch accounts + 6-month trend on mount (once)
  useEffect(() => {
    if (!householdId) return
    const end = new Date()
    const start = new Date(end.getFullYear(), end.getMonth() - 5, 1)

    supabase.from('budget_accounts').select('*').eq('household_id', householdId).order('name')
      .then(({ data }) => setAccounts(data ?? []))

    supabase
      .from('transactions')
      .select('amount, transaction_date')
      .eq('household_id', householdId)
      .gte('transaction_date', start.toISOString().slice(0, 10))
      .lte('transaction_date', end.toISOString().slice(0, 10))
      .then(({ data }) => {
        const map: Record<string, { income: number; expenses: number }> = {}
        for (const tx of data ?? []) {
          const key = tx.transaction_date.slice(0, 7)
          if (!map[key]) map[key] = { income: 0, expenses: 0 }
          if (tx.amount > 0) map[key].income += tx.amount
          else map[key].expenses += Math.abs(tx.amount)
        }
        setTrendData(
          Object.entries(map)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, v]) => ({ month, ...v }))
        )
      })
  }, [householdId])

  // Fetch month-scoped transactions + envelope spending on month change
  useEffect(() => {
    if (!householdId) return
    setLoading(true)
    const { startDate, endDate } = monthBounds(currentMonth)

    Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .eq('household_id', householdId)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: false }),
      supabase
        .from('budget_categories')
        .select('id, name, color, icon, monthly_limit')
        .eq('household_id', householdId)
        .order('name'),
      supabase
        .from('transactions')
        .select('category_id, amount')
        .eq('household_id', householdId)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .lt('amount', 0),
    ]).then(([txRes, catRes, spendRes]) => {
      setTransactions(txRes.data ?? [])

      const spendMap: Record<string, number> = {}
      for (const tx of spendRes.data ?? []) {
        if (tx.category_id) spendMap[tx.category_id] = (spendMap[tx.category_id] ?? 0) + Math.abs(tx.amount)
      }
      setEnvelopeCategories(
        (catRes.data ?? []).map(cat => ({
          id: cat.id,
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          monthly_limit: cat.monthly_limit,
          spent: spendMap[cat.id] ?? 0,
        }))
      )
      setLoading(false)
    })
  }, [householdId, currentMonth])

  // Derived values
  const unreviewed = transactions.filter(t => !t.category)
  const income = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const expenses = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
  const savings = transactions.filter(t => t.category === 'savings').reduce((s, t) => s + Math.abs(t.amount), 0)
  const categorySpending = {
    needs: transactions.filter(t => t.category === 'needs' && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
    wants: transactions.filter(t => t.category === 'wants' && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
    savings,
    transfers: transactions.filter(t => t.category === 'transfers').reduce((s, t) => s + Math.abs(t.amount), 0),
  }
  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Mutations
  const handleCategorize = async (txId: string, category: string) => {
    const { error } = await supabase.from('transactions').update({ category }).eq('id', txId)
    if (error) throw error
    setTransactions(prev => prev.map(t => t.id === txId ? { ...t, category } : t))
  }

  const handleCategoryChange = async (txId: string, category: string) => {
    const { error } = await supabase.from('transactions').update({ category }).eq('id', txId)
    if (error) return
    setTransactions(prev => prev.map(t => t.id === txId ? { ...t, category } : t))
  }

  const handleSaveAccount = async (form: AccountForm, editingId?: string) => {
    if (!householdId || !user) return
    if (editingId) {
      await supabase.from('budget_accounts').update({
        name: form.name,
        type: form.type,
        balance: parseFloat(form.balance),
        currency: form.currency,
      }).eq('id', editingId)
      setAccounts(prev => prev.map(a =>
        a.id === editingId ? { ...a, name: form.name, type: form.type, balance: parseFloat(form.balance), currency: form.currency } : a
      ))
    } else {
      const { data } = await supabase.from('budget_accounts').insert({
        household_id: householdId,
        name: form.name,
        type: form.type,
        balance: parseFloat(form.balance),
        currency: form.currency,
        created_by: user.id,
      }).select().single()
      if (data) setAccounts(prev => [...prev, data])
    }
  }

  const handleUploadStatement = async (file: File, accountId: string) => {
    if (!user || !householdId) return
    try {
      const text = await file.text()
      const rows = parseCSV(text)
      if (rows.length < 2) throw new Error('CSV file appears empty')

      const headers = rows[0].map(h => h.trim())
      const dateIdx = headers.findIndex(h => h === 'Posting Date' || h === 'Date')
      const amountIdx = headers.findIndex(h => h === 'Amount')
      const descIdx = headers.findIndex(h => h === 'Description')
      if (dateIdx === -1 || amountIdx === -1 || descIdx === -1) {
        throw new Error(`Missing required columns. Found: ${headers.join(', ')}`)
      }

      const newTxs = []
      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i]
        const date = cols[dateIdx]?.trim()
        const amount = parseFloat(cols[amountIdx])
        const description = cols[descIdx]?.trim()
        if (!date || isNaN(amount) || !description) continue

        const { data: dup } = await supabase
          .from('transactions')
          .select('id')
          .eq('account_id', accountId)
          .eq('amount', amount)
          .eq('description', description)
          .eq('transaction_date', date)
          .limit(1)

        if (!dup?.length) {
          newTxs.push({ account_id: accountId, amount, description, transaction_date: date, household_id: householdId, user_id: user.id })
        }
      }

      if (newTxs.length > 0) {
        await supabase.from('transactions').insert(newTxs)
      }
      alert(`✓ Imported ${newTxs.length} new transaction${newTxs.length !== 1 ? 's' : ''}`)
      // Refresh transactions
      const { startDate, endDate } = monthBounds(currentMonth)
      const { data } = await supabase
        .from('transactions').select('*').eq('household_id', householdId)
        .gte('transaction_date', startDate).lte('transaction_date', endDate)
        .order('transaction_date', { ascending: false })
      setTransactions(data ?? [])
    } catch (err) {
      alert(`Import failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = []
    let row: string[] = []
    let field = ''
    let inQuotes = false
    for (let i = 0; i < text.length; i++) {
      const c = text[i]
      const next = text[i + 1]
      if (c === '"') {
        if (inQuotes && next === '"') { field += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (c === ',' && !inQuotes) {
        row.push(field.trim().replace(/^"|"$/g, ''))
        field = ''
      } else if ((c === '\n' || c === '\r') && !inQuotes) {
        if (field || row.length > 0) { row.push(field.trim().replace(/^"|"$/g, '')); rows.push(row); row = []; field = '' }
        if (c === '\r' && next === '\n') i++
      } else {
        field += c
      }
    }
    if (field || row.length > 0) { row.push(field.trim().replace(/^"|"$/g, '')); rows.push(row) }
    return rows
  }

  if (loading) {
    return (
      <ModulePage module="budget">
        <div className="px-3 sm:px-4 py-6 sm:py-8 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 w-32 rounded-xl bg-stone-200 dark:bg-stone-800 animate-pulse" />
            <div className="h-10 w-36 rounded-xl bg-stone-200 dark:bg-stone-800 animate-pulse" />
          </div>
          <div className="h-64 rounded-3xl bg-violet-900/30 animate-pulse mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-stone-100 dark:bg-stone-800 animate-pulse" />
            ))}
          </div>
          <div className="h-52 rounded-2xl bg-stone-800/50 animate-pulse" />
        </div>
      </ModulePage>
    )
  }

  if (view === 'review' && unreviewed.length > 0) {
    return (
      <ModulePage module="budget">
        <ReviewView
          unreviewed={unreviewed}
          onCategorize={handleCategorize}
          onBack={() => setView('dashboard')}
        />
      </ModulePage>
    )
  }

  return (
    <ModulePage module="budget">
    <div className="px-3 sm:px-4 py-6 sm:py-8 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Budget</h1>
          <p className="text-xs text-stone-400 mt-0.5">Track, review &amp; plan your spending</p>
        </div>
        <button
          onClick={() => setShowQuickAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95"
          style={{ boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}
        >
          <Plus className="w-4 h-4" /> Add Transaction
        </button>
      </div>

      <MonthSelector
        currentMonth={currentMonth}
        onPrev={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1))}
        onNext={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1))}
      />

      {/* Two-column desktop grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (2/3) */}
        <div className="lg:col-span-2">
          <BudgetHeroRing
            income={income}
            expenses={expenses}
            monthLabel={monthLabel}
            unreviewedCount={unreviewed.length}
            onReviewClick={() => setView('review')}
          />

          <MonthlySummaryStrip
            income={income}
            expenses={expenses}
            savings={savings}
            uncategorizedCount={unreviewed.length}
            onReviewClick={() => setView('review')}
          />

          <SpendingTrendChart data={trendData} />

          <TransactionList
            transactions={transactions}
            onCategoryChange={handleCategoryChange}
            onReviewClick={() => setView('review')}
          />
        </div>

        {/* Right column (1/3) */}
        <div className="space-y-6">
          <SpendingDonut
            needs={categorySpending.needs}
            wants={categorySpending.wants}
            savings={categorySpending.savings}
            transfers={categorySpending.transfers}
          />

          <CategoryEnvelopeGrid
            categories={envelopeCategories}
          />

          <AccountsPanel
            accounts={accounts}
            onSaveAccount={handleSaveAccount}
            onUploadStatement={handleUploadStatement}
          />
        </div>
      </div>

      {/* Quick Add modal */}
      {showQuickAdd && user && (
        <QuickAddTransaction
          accounts={accounts}
          householdId={householdId!}
          userId={user.id}
          onSuccess={tx => {
            setTransactions(prev => [tx, ...prev])
            setShowQuickAdd(false)
          }}
          onClose={() => setShowQuickAdd(false)}
        />
      )}
    </div>
    </ModulePage>
  )
}
