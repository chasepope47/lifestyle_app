'use client'
import { formatCurrency } from '@lifestyle/shared'
import { TrendingUp, TrendingDown } from 'lucide-react'

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
  const safeToSpend = income - expenses
  const spentPct = income > 0 ? Math.min(100, (expenses / income) * 100) : 0
  const isOverBudget = expenses > income

  const size = 200
  const strokeWidth = 14
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const fillLength = (spentPct / 100) * circumference

  const fillColor = isOverBudget ? '#f87171' : '#a78bfa'
  const trackColor = 'rgba(255,255,255,0.12)'

  return (
    <div className="relative rounded-3xl overflow-hidden mb-6" style={{ background: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 40%, #3b0764 100%)' }}>
      {/* Decorative background blobs */}
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
      <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

      <div className="relative p-6 sm:p-8">
        {/* Month label */}
        <p className="text-violet-300/70 text-sm font-medium mb-6">{monthLabel}</p>

        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
          {/* Ring */}
          <div className="relative flex-shrink-0">
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
              <circle
                cx={size / 2} cy={size / 2} r={r}
                fill="none"
                stroke={fillColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${fillLength} ${circumference}`}
                style={{ transition: 'stroke-dasharray 0.8s ease', filter: 'drop-shadow(0 0 8px rgba(167,139,250,0.6))' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold leading-none ${isOverBudget ? 'text-red-300' : 'text-white'}`}>
                {formatCurrency(Math.abs(safeToSpend))}
              </span>
              <span className="text-violet-300/70 text-xs mt-1.5 text-center">
                {isOverBudget ? 'over budget' : 'remaining'}
              </span>
              <span className="text-violet-200/50 text-xs mt-0.5">{spentPct.toFixed(0)}% used</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 w-full">
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <p className="text-violet-200/60 text-xs">Income</p>
                </div>
                <p className="text-emerald-300 text-xl font-bold">{formatCurrency(income)}</p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                  <p className="text-violet-200/60 text-xs">Spent</p>
                </div>
                <p className={`text-xl font-bold ${isOverBudget ? 'text-red-300' : 'text-white'}`}>{formatCurrency(expenses)}</p>
              </div>
            </div>

            {unreviewedCount > 0 && (
              <button
                onClick={onReviewClick}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
                style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fde68a' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                {unreviewedCount} to categorize
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
