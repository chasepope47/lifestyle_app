'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { parseCurrencyInput } from '@lifestyle/shared'
import type { Database } from '@lifestyle/db'

type Account = Database['public']['Tables']['budget_accounts']['Row']
type Transaction = Database['public']['Tables']['transactions']['Row']

type MacroCategory = 'needs' | 'wants' | 'savings' | 'transfers'

const MACRO_CATEGORIES: { key: MacroCategory; label: string; color: string }[] = [
  { key: 'needs', label: 'Needs', color: '#3b82f6' },
  { key: 'wants', label: 'Wants', color: '#eab308' },
  { key: 'savings', label: 'Savings', color: '#22c55e' },
  { key: 'transfers', label: 'Transfers', color: '#a855f7' },
]

interface QuickAddTransactionProps {
  accounts: Account[]
  householdId: string
  userId: string
  onSuccess: (tx: Transaction) => void
  onClose: () => void
}

export function QuickAddTransaction({
  accounts,
  householdId,
  userId,
  onSuccess,
  onClose,
}: QuickAddTransactionProps) {
  const today = new Date().toISOString().slice(0, 10)
  const [isExpense, setIsExpense] = useState(true)
  const [amountRaw, setAmountRaw] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(today)
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [category, setCategory] = useState<MacroCategory | null>(null)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!description.trim() || !amountRaw || !accountId) {
      setError('Please fill in description, amount, and account.')
      return
    }

    const parsed = parseCurrencyInput(amountRaw)
    if (isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid amount.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const amount = isExpense ? -parsed : parsed

      const { data, error: insertError } = await supabase
        .from('transactions')
        .insert({
          household_id: householdId,
          user_id: userId,
          account_id: accountId,
          amount,
          description: description.trim(),
          transaction_date: date,
          category: category ?? null,
          notes: notes.trim() || null,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Update account balance
      const { data: acc } = await supabase
        .from('budget_accounts')
        .select('balance')
        .eq('id', accountId)
        .single()
      if (acc) {
        await supabase
          .from('budget_accounts')
          .update({ balance: acc.balance + amount })
          .eq('id', accountId)
      }

      onSuccess(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add transaction.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Add Transaction</h3>
          <button onClick={onClose} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Expense / Income toggle */}
        <div className="flex rounded-xl border border-stone-200 dark:border-stone-700 p-1 mb-5">
          <button
            onClick={() => setIsExpense(true)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              isExpense
                ? 'bg-red-500 text-white shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
            }`}
          >
            Expense
          </button>
          <button
            onClick={() => setIsExpense(false)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              !isExpense
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
            }`}
          >
            Income
          </button>
        </div>

        {/* Amount */}
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-stone-400">$</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amountRaw}
            onChange={e => setAmountRaw(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5 uppercase tracking-wide">Description</label>
          <input
            type="text"
            placeholder="e.g., Grocery run, Netflix, Rent"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-stone-400"
          />
        </div>

        {/* Date + Account */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5 uppercase tracking-wide">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5 uppercase tracking-wide">Account</label>
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Macro category */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5 uppercase tracking-wide">Category</label>
          <div className="grid grid-cols-4 gap-2">
            {MACRO_CATEGORIES.map(({ key, label, color }) => {
              const isActive = category === key
              return (
                <button
                  key={key}
                  onClick={() => setCategory(isActive ? null : key)}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive ? 'text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                  style={isActive ? { backgroundColor: color } : {}}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5 uppercase tracking-wide">Notes (optional)</label>
          <textarea
            rows={2}
            placeholder="Any additional details…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-stone-400 resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 mb-3">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors disabled:opacity-60 mb-2"
        >
          {isSubmitting ? 'Saving…' : `Add ${isExpense ? 'Expense' : 'Income'}`}
        </button>
        <button
          onClick={onClose}
          className="w-full py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
