'use client'
import { Plus } from 'lucide-react'
import { formatCurrency } from '@lifestyle/shared'

export interface EnvelopeCategory {
  id: string
  name: string
  color: string | null
  icon: string | null
  monthly_limit: number | null
  is_income: boolean
  spent: number  // for expense cats = amount spent; for income cats = amount received
}

interface CategoryEnvelopeGridProps {
  categories: EnvelopeCategory[]
  onAddCategory?: () => void
  onEditCategory?: (cat: EnvelopeCategory) => void
}

function getSpendBarColor(pct: number): string {
  if (pct >= 100) return '#f87171'
  if (pct >= 90)  return '#fb923c'
  if (pct >= 75)  return '#fbbf24'
  return '#34d399'
}

function getIncomeBarColor(pct: number): string {
  if (pct >= 100) return '#34d399'
  if (pct >= 75)  return '#fbbf24'
  return '#f87171'
}

function EnvelopeCard({ cat, onEdit }: { cat: EnvelopeCategory; onEdit?: (cat: EnvelopeCategory) => void }) {
  const hasTarget = cat.monthly_limit != null && cat.monthly_limit > 0
  const pct = hasTarget ? Math.min(110, (cat.spent / cat.monthly_limit!) * 100) : 0
  const diff = hasTarget ? cat.monthly_limit! - cat.spent : 0
  const isOver = hasTarget && cat.spent > cat.monthly_limit!
  const barColor = cat.is_income ? getIncomeBarColor(pct) : getSpendBarColor(pct)

  const defaultAccent = cat.is_income ? '#10b981' : '#7c3aed'
  const accentColor = cat.color && cat.color.startsWith('#') ? cat.color : defaultAccent

  return (
    <div
      onClick={() => onEdit?.(cat)}
      className="relative rounded-2xl p-4 overflow-hidden bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      {onEdit && (
        <span className="absolute top-3 right-3 text-[11px] uppercase tracking-[0.14em] font-semibold text-violet-600 dark:text-violet-300">
          Edit
        </span>
      )}
      {/* Color accent strip at top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ backgroundColor: accentColor }} />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
            style={{ backgroundColor: accentColor + '22' }}
          >
            {cat.icon ? (
              <span>{cat.icon}</span>
            ) : (
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: accentColor }} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-50 truncate">{cat.name}</p>
            {cat.is_income && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500 leading-none mt-0.5">Income</p>
            )}
          </div>
        </div>
        <p className="text-sm font-bold text-stone-900 dark:text-stone-50 ml-2 flex-shrink-0">
          {formatCurrency(cat.spent)}
        </p>
      </div>

      {hasTarget ? (
        <>
          <div className="h-1.5 rounded-full mb-1.5 bg-stone-100 dark:bg-stone-800">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, pct)}%`, backgroundColor: barColor, boxShadow: `0 0 6px ${barColor}66` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-stone-400">
              {pct.toFixed(0)}% of {formatCurrency(cat.monthly_limit!)} {cat.is_income ? 'goal' : ''}
            </span>
            {cat.is_income ? (
              isOver ? (
                <span className="font-semibold" style={{ color: '#34d399' }}>Goal met ✓</span>
              ) : (
                <span className="text-stone-400">{formatCurrency(Math.abs(diff))} to go</span>
              )
            ) : (
              isOver ? (
                <span className="font-semibold" style={{ color: '#f87171' }}>{formatCurrency(Math.abs(diff))} over</span>
              ) : (
                <span className="text-stone-400">{formatCurrency(diff)} left</span>
              )
            )}
          </div>
        </>
      ) : (
        <p className="text-xs text-stone-400 italic">
          {cat.is_income ? 'No income target set' : 'No limit set'}
        </p>
      )}
    </div>
  )
}

export function CategoryEnvelopeGrid({ categories, onAddCategory, onEditCategory }: CategoryEnvelopeGridProps) {
  return (
    <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Budget Envelopes</h3>
          {categories.length > 0 && (
            <p className="text-xs text-stone-400 mt-0.5">{categories.length} categor{categories.length === 1 ? 'y' : 'ies'}</p>
          )}
        </div>
        {onAddCategory && (
          <button
            onClick={onAddCategory}
            className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 font-medium hover:text-violet-700 dark:hover:text-violet-300"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        )}
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(124,58,237,0.05))' }}>
            <Plus className="w-5 h-5 text-violet-500" />
          </div>
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-1">No envelopes yet</p>
          <p className="text-xs text-stone-400 mb-3 leading-relaxed">Create budget categories with monthly limits to track your spending</p>
          {onAddCategory && (
            <button
              onClick={onAddCategory}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
            >
              Create Envelope
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map(cat => <EnvelopeCard key={cat.id} cat={cat} onEdit={onEditCategory} />)}
        </div>
      )}
    </div>
  )
}
