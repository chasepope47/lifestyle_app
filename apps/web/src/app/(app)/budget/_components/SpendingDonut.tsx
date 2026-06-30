'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@lifestyle/shared'

export interface DonutSlice {
  key: string
  label: string
  color: string
  value: number
}

interface SpendingDonutProps {
  data: DonutSlice[]
}

// Curated palette: vivid, distinct colors that read well on dark backgrounds
const PALETTE = [
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
  '#14b8a6', // teal
  '#84cc16', // lime
  '#3b82f6', // blue
  '#a855f7', // purple
  '#e11d48', // rose
]

// If most slices share the same color (e.g. all defaulted to #7c3aed),
// auto-assign distinct palette colors; otherwise respect per-slice colors.
function resolveColors(slices: DonutSlice[]): string[] {
  const counts: Record<string, number> = {}
  for (const s of slices) counts[s.color] = (counts[s.color] ?? 0) + 1
  const maxCount = Math.max(...Object.values(counts))
  const usePalette = slices.length > 1 && maxCount > slices.length / 2
  return slices.map((s, i) => (usePalette ? PALETTE[i % PALETTE.length] : s.color))
}

const TOOLTIP_STYLE = {
  backgroundColor: '#0c0a09',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  color: '#fafaf9',
  fontSize: '13px',
  padding: '8px 12px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
}

export function SpendingDonut({ data: rawData }: SpendingDonutProps) {
  const sorted = [...rawData].filter(s => s.value > 0).sort((a, b) => b.value - a.value)
  const total = sorted.reduce((s, d) => s + d.value, 0)
  const colors = resolveColors(sorted)
  const data = sorted.map((s, i) => ({ ...s, color: colors[i] }))

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm"
      style={{ background: 'linear-gradient(145deg, #1c1917 0%, #111827 100%)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="px-5 pt-5 pb-3 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-stone-100">Spending Breakdown</h3>
          {total > 0 && <p className="text-xs text-stone-500 mt-0.5">{formatCurrency(total)} total</p>}
        </div>
      </div>

      {total === 0 ? (
        <div className="px-5 pb-5">
          <p className="text-sm text-stone-500 text-center py-6">No spending data for this month</p>
        </div>
      ) : (
        <div className="pb-5">
          {/* Donut chart with center label */}
          <div className="relative w-full h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  innerRadius={52}
                  outerRadius={72}
                  paddingAngle={2}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  strokeWidth={0}
                >
                  {data.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.color}
                      style={{ filter: `drop-shadow(0 0 4px ${entry.color}44)`, outline: 'none' }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value ?? 0)), '']}
                  contentStyle={TOOLTIP_STYLE}
                  itemStyle={{ color: '#fafaf9' }}
                  separator=""
                  cursor={false}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center total overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-stone-500 leading-none mb-0.5">spent</span>
              <span className="text-base font-bold text-stone-100 leading-none">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Legend — 1 column, compact rows */}
          <div className="px-5 space-y-1.5 mt-1">
            {data.map(({ key, label, color, value }) => {
              const pct = total > 0 ? (value / total) * 100 : 0
              return (
                <div key={key} className="flex items-center gap-2.5">
                  <div
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-stone-300 flex-1 truncate">{label}</span>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Mini bar */}
                    <div className="w-16 h-1 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className="text-xs text-stone-500 w-7 text-right">{pct.toFixed(0)}%</span>
                    <span className="text-xs font-semibold text-stone-200 w-16 text-right tabular-nums">
                      {formatCurrency(value)}
                    </span>
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
