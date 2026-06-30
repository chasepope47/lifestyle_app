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
    <div className="flex items-center justify-center gap-4 mb-6">
      <button
        onClick={onPrev}
        className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        aria-label="Previous month"
      >
        <ChevronLeft className="w-5 h-5 text-stone-500 dark:text-stone-400" />
      </button>

      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50">{monthLabel}</h2>
        {!isCurrentMonth && (
          <button
            onClick={() => {/* handled by parent */}}
            className="text-xs text-violet-500 dark:text-violet-400 font-medium hover:text-violet-600 dark:hover:text-violet-300"
          >
            (not current)
          </button>
        )}
      </div>

      <button
        onClick={onNext}
        disabled={isCurrentMonth}
        className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Next month"
      >
        <ChevronRight className="w-5 h-5 text-stone-500 dark:text-stone-400" />
      </button>
    </div>
  )
}
