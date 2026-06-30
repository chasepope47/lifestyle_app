'use client'
import { Plus } from 'lucide-react'
import { formatCurrency } from '@lifestyle/shared'

export interface EnvelopeCategory {
  id: string
  name: string
  color: string | null
  icon: string | null
  monthly_limit: number | null
  spent: number
}

interface CategoryEnvelopeGridProps {
  categories: EnvelopeCategory[]
  onAddCategory?: () => void
}

function getProgressColor(pct: number): string {
  if (pct >= 100) return '#ef4444'
  if (pct >= 90) return '#f97316'
  if (pct >= 75) return '#eab308'
  return '#22c55e'
}

function EnvelopeCard({ cat }: { cat: EnvelopeCategory }) {
  const hasLimit = cat.monthly_limit != null && cat.monthly_limit > 0
  const pct = hasLimit ? Math.min(110, (cat.spent / cat.monthly_limit!) * 100) : 0
  const remaining = hasLimit ? cat.monthly_limit! - cat.spent : 0
  const isOver = hasLimit && cat.spent > cat.monthly_limit!
  const progressColor = getProgressColor(pct)

  // Use category color as hex for inline style (with opacity for bg)
  const accentColor = cat.color && cat.color.startsWith('#') ? cat.color : '#7c3aed'
  const bgStyle = { backgroundColor: accentColor + '22' }
  const iconStyle = { color: accentColor }

  return (
    <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
            style={bgStyle}
          >
            {cat.icon ? (
              <span style={iconStyle}>{cat.icon}</span>
            ) : (
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: accentColor }} />
            )}
          </div>
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-50 truncate">{cat.name}</p>
        </div>
        <p className="text-sm font-bold text-stone-900 dark:text-stone-50 flex-shrink-0 ml-2">
          {formatCurrency(cat.spent)}
        </p>
      </div>

      {hasLimit ? (
        <>
          <div className="h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden mb-1.5">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, pct)}%`, backgroundColor: progressColor }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-stone-500">{pct.toFixed(0)}% used</span>
            {isOver ? (
              <span className="text-red-500 font-medium">{formatCurrency(Math.abs(remaining))} over</span>
            ) : (
              <span className="text-stone-500">{formatCurrency(remaining)} left</span>
            )}
          </div>
        </>
      ) : (
        <p className="text-xs text-stone-400 italic">No limit set</p>
      )}
    </div>
  )
}

export function CategoryEnvelopeGrid({ categories, onAddCategory }: CategoryEnvelopeGridProps) {
  return (
    <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Budget Categories</h3>
        {onAddCategory && (
          <button
            onClick={onAddCategory}
            className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 font-medium hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        )}
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-6">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mx-auto mb-3">
            <Plus className="w-5 h-5 text-violet-500" />
          </div>
          <p className="text-sm font-medium text-stone-900 dark:text-stone-50 mb-1">No budget categories yet</p>
          <p className="text-xs text-stone-400 mb-3">Create categories with spending limits to track your envelopes</p>
          {onAddCategory && (
            <button
              onClick={onAddCategory}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
            >
              Create Category
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map(cat => (
            <EnvelopeCard key={cat.id} cat={cat} />
          ))}
        </div>
      )}
    </div>
  )
}
