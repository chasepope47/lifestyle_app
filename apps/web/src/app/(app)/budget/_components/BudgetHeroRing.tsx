'use client'
import { formatCurrency } from '@lifestyle/shared'

interface BudgetHeroRingProps {
  income: number
  expenses: number
  monthLabel: string
  unreviewedCount: number
  onReviewClick: () => void
}

export function BudgetHeroRing({
  income,
  expenses,
  monthLabel,
  unreviewedCount,
  onReviewClick,
}: BudgetHeroRingProps) {
  const safeToSpend = Math.max(0, income - expenses)
  const spentPct = income > 0 ? Math.min(100, (expenses / income) * 100) : 0
  const isOverBudget = expenses > income

  // SVG ring constants
  const size = 160
  const strokeWidth = 10
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const fillLength = (spentPct / 100) * circumference

  const arcColor = isOverBudget ? '#ef4444' : '#7c3aed' // red or violet-700

  return (
    <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 mb-6">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Ring */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            {/* Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="#e7e5e4"
              strokeWidth={strokeWidth}
              className="dark:[stroke:#292524]"
            />
            {/* Arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={arcColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${fillLength} ${circumference}`}
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-stone-900 dark:text-stone-50 leading-none">
              {formatCurrency(safeToSpend)}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400 mt-1 text-center leading-tight">
              {isOverBudget ? 'over budget' : 'left to spend'}
            </span>
          </div>
        </div>

        {/* Stats + info */}
        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">{monthLabel}</p>

          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div>
              <p className="text-xs text-stone-400 mb-0.5">Income</p>
              <p className="text-xl font-bold text-emerald-500">{formatCurrency(income)}</p>
            </div>
            <div className="hidden sm:block w-px bg-stone-200 dark:bg-stone-700" />
            <div>
              <p className="text-xs text-stone-400 mb-0.5">Spent</p>
              <p className={`text-xl font-bold ${isOverBudget ? 'text-red-500' : 'text-stone-900 dark:text-stone-50'}`}>
                {formatCurrency(expenses)}
              </p>
            </div>
            <div className="hidden sm:block w-px bg-stone-200 dark:bg-stone-700" />
            <div>
              <p className="text-xs text-stone-400 mb-0.5">Used</p>
              <p className={`text-xl font-bold ${isOverBudget ? 'text-red-500' : 'text-violet-600 dark:text-violet-400'}`}>
                {spentPct.toFixed(0)}%
              </p>
            </div>
          </div>

          {unreviewedCount > 0 && (
            <button
              onClick={onReviewClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {unreviewedCount} transaction{unreviewedCount !== 1 ? 's' : ''} to review
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
