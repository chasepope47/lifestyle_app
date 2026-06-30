'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MonthSelectorProps {
  currentMonth: Date
  onPrev: () => void
  onNext: () => void
}

export function MonthSelector({ currentMonth, onPrev, onNext }: MonthSelectorProps) {
  const now = new Date()
  const isCurrentMonth =
    currentMonth.getMonth() === now.getMonth() &&
    currentMonth.getFullYear() === now.getFullYear()

  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="flex items-center justify-center gap-3 mb-6">
      <button
        onClick={onPrev}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-sm hover:bg-stone-50 dark:hover:bg-stone-800 transition-all hover:shadow"
        aria-label="Previous month"
      >
        <ChevronLeft className="w-4 h-4 text-stone-500 dark:text-stone-400" />
      </button>

      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-sm">
        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">{monthLabel}</h2>
        {!isCurrentMonth && (
          <span className="text-xs text-violet-500 dark:text-violet-400 font-medium bg-violet-50 dark:bg-violet-900/20 px-1.5 py-0.5 rounded-full">
            past
          </span>
        )}
      </div>

      <button
        onClick={onNext}
        disabled={isCurrentMonth}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-sm hover:bg-stone-50 dark:hover:bg-stone-800 transition-all hover:shadow disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-sm"
        aria-label="Next month"
      >
        <ChevronRight className="w-4 h-4 text-stone-500 dark:text-stone-400" />
      </button>
    </div>
  )
}
