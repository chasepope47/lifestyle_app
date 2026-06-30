'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@lifestyle/shared'

interface SpendingDonutProps {
  needs: number
  wants: number
  savings: number
  transfers: number
}

const SLICES = [
  { key: 'needs', label: 'Needs', color: '#3b82f6' },
  { key: 'wants', label: 'Wants', color: '#eab308' },
  { key: 'savings', label: 'Savings', color: '#22c55e' },
  { key: 'transfers', label: 'Transfers', color: '#a855f7' },
]

const TOOLTIP_STYLE = {
  backgroundColor: '#1c1917',
  border: '1px solid #44403c',
  borderRadius: '12px',
  color: '#fafaf9',
  fontSize: '13px',
}

export function SpendingDonut({ needs, wants, savings, transfers }: SpendingDonutProps) {
  const values: Record<string, number> = { needs, wants, savings, transfers }
  const data = SLICES.map(s => ({ ...s, value: values[s.key] })).filter(s => s.value > 0)
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6">
      <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-4">Spending Breakdown</h3>

      {total === 0 ? (
        <p className="text-sm text-stone-400 text-center py-6">No spending data for this month</p>
      ) : (
        <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-5">
          <div className="w-40 h-40 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  innerRadius={48}
                  outerRadius={68}
                  paddingAngle={3}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value ?? 0)), '']}
                  contentStyle={TOOLTIP_STYLE}
                  itemStyle={{ color: '#fafaf9' }}
                  separator=""
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 w-full space-y-2.5">
            {SLICES.map(({ key, label, color }) => {
              const val = values[key]
              if (val <= 0) return null
              const pct = total > 0 ? (val / total) * 100 : 0
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-xs text-stone-600 dark:text-stone-400">{label}</span>
                    </div>
                    <span className="text-xs font-semibold text-stone-900 dark:text-stone-50">
                      {formatCurrency(val)}
                    </span>
                  </div>
                  <div className="h-1 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
