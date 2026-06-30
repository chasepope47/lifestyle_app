'use client'
import { AlertCircle } from 'lucide-react'
import { formatCurrency } from '@lifestyle/shared'

interface MonthlySummaryStripProps {
  income: number
  expenses: number
  savings: number
  uncategorizedCount: number
  onReviewClick: () => void
}

export function MonthlySummaryStrip({
  income,
  expenses,
  savings,
  uncategorizedCount,
  onReviewClick,
}: MonthlySummaryStripProps) {
  const net = income - expenses
  const isPositive = net >= 0

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 text-center">
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">Income</p>
        <p className="text-xl font-bold text-emerald-500">{formatCurrency(income)}</p>
      </div>

      <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 text-center">
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">Spent</p>
        <p className="text-xl font-bold text-stone-900 dark:text-stone-50">{formatCurrency(expenses)}</p>
      </div>

      <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 text-center">
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">Saved</p>
        <p className={`text-xl font-bold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
          {formatCurrency(savings)}
        </p>
      </div>

      <button
        onClick={uncategorizedCount > 0 ? onReviewClick : undefined}
        className={`rounded-2xl bg-white dark:bg-stone-900 border p-4 text-center transition-colors ${
          uncategorizedCount > 0
            ? 'border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/10 cursor-pointer'
            : 'border-stone-200 dark:border-stone-800'
        }`}
      >
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">To Review</p>
        <div className="flex items-center justify-center gap-1.5">
          {uncategorizedCount > 0 && (
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          )}
          <p className={`text-xl font-bold ${uncategorizedCount > 0 ? 'text-amber-500' : 'text-stone-400'}`}>
            {uncategorizedCount}
          </p>
        </div>
      </button>
    </div>
  )
}
