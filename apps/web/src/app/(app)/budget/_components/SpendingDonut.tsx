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
  { key: 'needs',     label: 'Needs',     color: '#60a5fa' },
  { key: 'wants',     label: 'Wants',     color: '#fbbf24' },
  { key: 'savings',   label: 'Savings',   color: '#34d399' },
  { key: 'transfers', label: 'Transfers', color: '#c084fc' },
]

const TOOLTIP_STYLE = {
  backgroundColor: '#0c0a09',
  border: '1px solid #292524',
  borderRadius: '12px',
  color: '#fafaf9',
  fontSize: '13px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
}

export function SpendingDonut({ needs, wants, savings, transfers }: SpendingDonutProps) {
  const values: Record<string, number> = { needs, wants, savings, transfers }
  const data = SLICES.map(s => ({ ...s, value: values[s.key] })).filter(s => s.value > 0)
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: 'linear-gradient(145deg, #1c1917 0%, #111827 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="p-5">
        <h3 className="text-sm font-semibold text-stone-100 mb-1">Spending Breakdown</h3>
        {total > 0 && (
          <p className="text-xs text-stone-500">{formatCurrency(total)} total</p>
        )}
      </div>

      {total === 0 ? (
        <div className="px-5 pb-5">
          <p className="text-sm text-stone-500 text-center py-6">No spending data for this month</p>
        </div>
      ) : (
        <div className="px-5 pb-5">
          <div className="flex flex-col items-center gap-4">
            <div className="w-full h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    innerRadius={46}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {data.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="none" style={{ filter: `drop-shadow(0 0 6px ${entry.color}55)` }} />
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

            <div className="w-full space-y-2">
              {SLICES.map(({ key, label, color }) => {
                const val = values[key]
                if (val <= 0) return null
                const pct = total > 0 ? (val / total) * 100 : 0
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}88` }} />
                        <span className="text-xs text-stone-400">{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-500">{pct.toFixed(0)}%</span>
                        <span className="text-xs font-semibold text-stone-200">{formatCurrency(val)}</span>
                      </div>
                    </div>
                    <div className="h-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}66` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
