'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@lifestyle/shared'

interface TrendDataPoint {
  month: string
  income: number
  expenses: number
}

interface SpendingTrendChartProps {
  data: TrendDataPoint[]
}

const TOOLTIP_STYLE = {
  backgroundColor: '#0c0a09',
  border: '1px solid #292524',
  borderRadius: '12px',
  color: '#fafaf9',
  fontSize: '13px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'short' })
}

function formatYAxis(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`
  return `$${value}`
}

export function SpendingTrendChart({ data }: SpendingTrendChartProps) {
  if (data.length === 0) return null

  return (
    <div className="rounded-2xl shadow-sm mb-6 overflow-hidden" style={{ background: 'linear-gradient(145deg, #1c1917 0%, #111827 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="p-5 pb-2">
        <h3 className="text-sm font-semibold text-stone-100">6-Month Trend</h3>
        <p className="text-xs text-stone-500 mt-0.5">Income vs expenses</p>
      </div>
      <div className="px-2 pb-5" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonthLabel}
              tick={{ fill: '#57534e', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fill: '#57534e', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip
              formatter={(value, name) => [formatCurrency(Number(value ?? 0)), String(name)]}
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ color: '#fafaf9' }}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Bar dataKey="income" name="Income" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={26} style={{ filter: 'drop-shadow(0 0 4px rgba(52,211,153,0.4))' }} />
            <Bar dataKey="expenses" name="Expenses" fill="#a78bfa" radius={[4, 4, 0, 0]} maxBarSize={26} style={{ filter: 'drop-shadow(0 0 4px rgba(167,139,250,0.4))' }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
