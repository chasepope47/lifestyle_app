'use client'
import { ArrowUpRight, ArrowDownRight, PiggyBank, Sparkles } from 'lucide-react'
import { formatCurrency } from '@lifestyle/shared'

interface MonthlySummaryStripProps {
  income: number
  expenses: number
  savings: number
  uncategorizedCount: number
  onReviewClick: () => void
}

interface StatCardProps {
  label: string
  value: string
  icon: React.ReactNode
  iconBg: string
  valueCls: string
  onClick?: () => void
  badge?: React.ReactNode
}

function StatCard({ label, value, icon, iconBg, valueCls, onClick, badge }: StatCardProps) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={`rounded-2xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-sm p-4 flex flex-col gap-2 text-left transition-all ${onClick ? 'hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        {badge}
      </div>
      <div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-0.5">{label}</p>
        <p className={`text-xl font-bold ${valueCls}`}>{value}</p>
      </div>
    </Tag>
  )
}

export function MonthlySummaryStrip({
  income,
  expenses,
  savings,
  uncategorizedCount,
  onReviewClick,
}: MonthlySummaryStripProps) {
  const net = income - expenses

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <StatCard
        label="Income"
        value={formatCurrency(income)}
        icon={<ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
        iconBg="bg-emerald-100 dark:bg-emerald-900/40"
        valueCls="text-emerald-600 dark:text-emerald-400"
      />

      <StatCard
        label="Spent"
        value={formatCurrency(expenses)}
        icon={<ArrowDownRight className="w-4 h-4 text-rose-500 dark:text-rose-400" />}
        iconBg="bg-rose-100 dark:bg-rose-900/40"
        valueCls="text-stone-900 dark:text-stone-50"
      />

      <StatCard
        label="Saved"
        value={formatCurrency(savings)}
        icon={<PiggyBank className="w-4 h-4 text-violet-600 dark:text-violet-400" />}
        iconBg="bg-violet-100 dark:bg-violet-900/40"
        valueCls={net >= 0 ? 'text-violet-600 dark:text-violet-400' : 'text-red-500'}
      />

      <StatCard
        label="To Review"
        value={String(uncategorizedCount)}
        icon={<Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
        iconBg={uncategorizedCount > 0 ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-stone-100 dark:bg-stone-800'}
        valueCls={uncategorizedCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400'}
        onClick={uncategorizedCount > 0 ? onReviewClick : undefined}
        badge={
          uncategorizedCount > 0 ? (
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-full">
              Tap
            </span>
          ) : undefined
        }
      />
    </div>
  )
}
