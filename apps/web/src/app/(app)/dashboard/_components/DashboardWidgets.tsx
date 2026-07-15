'use client'
import Link from 'next/link'
import { ShoppingCart, Footprints, Moon, ArrowUpRight, Flame, Briefcase } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { ProgressRing } from '@/components/ui/ProgressRing'
import type { CategorySlice, DailySpend, PantryLowItem } from './useDashboardData'

const currency = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export function SafeToSpendWidget({
  amount,
  dailySpend,
  velocityPct,
}: {
  amount: number
  dailySpend: DailySpend[]
  velocityPct: number | null
}) {
  const max = Math.max(1, ...dailySpend.map(d => d.amount))
  return (
    <GlassCard className="p-6 relative overflow-hidden col-span-2">
      <div className="absolute top-4 right-4">
        <Badge color="var(--accent2)">Live</Badge>
      </div>
      <span className="text-data-label font-mono uppercase tracking-widest text-on-surface-variant" style={{ color: 'var(--on-surface-variant)' }}>
        Safe to Spend
      </span>
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mt-1">{currency(amount)}</h2>

      <div className="mt-6 h-24 w-full flex items-end gap-1">
        {dailySpend.map((d, i) => {
          const pct = Math.max(6, (d.amount / max) * 100)
          const isLast = i === dailySpend.length - 1
          return (
            <div
              key={d.date}
              className="flex-1 rounded-t-sm"
              style={{
                height: `${pct}%`,
                background: isLast ? 'var(--accent2)' : 'var(--accent)',
                opacity: isLast ? 0.9 : 0.25 + (i / dailySpend.length) * 0.5,
                boxShadow: isLast ? '0 0 16px color-mix(in srgb, var(--accent2) 50%, transparent)' : undefined,
              }}
            />
          )
        })}
      </div>

      <div className="mt-3 flex justify-between items-center text-data-label font-mono" style={{ color: 'var(--outline)' }}>
        <span>Spend Velocity</span>
        {velocityPct !== null ? (
          <span className="font-semibold" style={{ color: velocityPct > 0 ? 'var(--accent2)' : '#34d399' }}>
            {velocityPct > 0 ? '+' : ''}{velocityPct}% vs last week
          </span>
        ) : (
          <span>Not enough data yet</span>
        )}
      </div>
    </GlassCard>
  )
}

export function StepsWidget({ steps }: { steps: number | null }) {
  const goal = 10000
  const progress = steps ? Math.min(steps / goal, 1) : 0
  return (
    <GlassCard className="p-4 flex flex-col items-center justify-center text-center gap-3">
      {steps != null ? (
        <>
          <ProgressRing progress={progress} size={88} strokeWidth={8} color="var(--accent)">
            <Footprints className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </ProgressRing>
          <div>
            <h3 className="font-mono font-semibold text-lg text-on-surface" style={{ color: 'var(--on-surface)' }}>{steps.toLocaleString()}</h3>
            <p className="text-data-label uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>Active Steps</p>
          </div>
        </>
      ) : (
        <>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--surface-container-highest)' }}>
            <Footprints className="w-5 h-5" style={{ color: 'var(--outline)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--on-surface-variant)' }}>No step data</p>
            <Link href="/workouts" className="text-data-label uppercase tracking-widest underline underline-offset-2" style={{ color: 'var(--accent)' }}>
              Connect health
            </Link>
          </div>
        </>
      )}
    </GlassCard>
  )
}

export function SleepWidget() {
  return (
    <GlassCard className="p-4 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <Moon className="w-5 h-5" style={{ color: 'var(--accent2)' }} />
        <span className="text-data-label font-mono uppercase tracking-widest" style={{ color: 'var(--outline)' }}>Coming soon</span>
      </div>
      <div className="mt-4">
        <h3 className="font-mono font-semibold text-lg" style={{ color: 'var(--on-surface-variant)' }}>—</h3>
        <p className="text-data-label uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>Sleep Score</p>
      </div>
    </GlassCard>
  )
}

export function PantryLowWidget({ items }: { items: PantryLowItem[] }) {
  const preview = items.slice(0, 3).map(i => i.name).join(', ')
  const extra = items.length > 3 ? ` +${items.length - 3} more` : ''
  return (
    <GlassCard className="p-4 flex items-center justify-between gap-4 col-span-2">
      <div className="flex items-center gap-4 min-w-0">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: items.length ? 'color-mix(in srgb, #ef4444 12%, transparent)' : 'var(--surface-container-highest)',
            border: `1px solid ${items.length ? 'color-mix(in srgb, #ef4444 25%, transparent)' : 'var(--glass-border)'}`,
          }}
        >
          <ShoppingCart className="w-5 h-5" style={{ color: items.length ? '#f87171' : 'var(--outline)' }} />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold" style={{ color: 'var(--on-surface)' }}>
            {items.length ? 'Pantry Low' : 'Pantry Stocked'}
          </h3>
          <p className="text-data-label truncate" style={{ color: 'var(--on-surface-variant)' }}>
            {items.length ? `${preview}${extra}` : 'Nothing needs restocking'}
          </p>
        </div>
      </div>
      <Link
        href="/pantry?tab=shopping"
        className="flex-shrink-0 px-4 py-2 rounded-xl text-data-label font-mono border transition-colors hover:bg-white/10"
        style={{ backgroundColor: 'var(--surface-container-high)', borderColor: 'var(--glass-border)', color: 'var(--on-surface)' }}
      >
        {items.length ? 'Review' : 'View Pantry'}
      </Link>
    </GlassCard>
  )
}

export function LearningWidget({
  studyStreak,
  activeApplications,
  newLeads,
}: {
  studyStreak: number
  activeApplications: number
  newLeads: number
}) {
  return (
    <GlassCard className="p-4 flex items-center justify-between gap-4 col-span-2">
      <div className="flex items-center gap-4 min-w-0">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'color-mix(in srgb, #4ade80 12%, transparent)', border: '1px solid color-mix(in srgb, #4ade80 25%, transparent)' }}
        >
          <Flame className="w-5 h-5" style={{ color: '#4ade80' }} />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold" style={{ color: 'var(--on-surface)' }}>
            {studyStreak > 0 ? `${studyStreak} day streak` : 'Learning'}
          </h3>
          <p className="text-data-label truncate flex items-center gap-1.5" style={{ color: 'var(--on-surface-variant)' }}>
            <Briefcase className="w-3 h-3" />
            {activeApplications} active application{activeApplications === 1 ? '' : 's'}
            {newLeads > 0 ? ` · ${newLeads} new lead${newLeads === 1 ? '' : 's'}` : ''}
          </p>
        </div>
      </div>
      <Link
        href="/learning"
        className="flex-shrink-0 px-4 py-2 rounded-xl text-data-label font-mono border transition-colors hover:bg-white/10"
        style={{ backgroundColor: 'var(--surface-container-high)', borderColor: 'var(--glass-border)', color: 'var(--on-surface)' }}
      >
        View
      </Link>
    </GlassCard>
  )
}

export function SharedBudgetWidget({ categories, total }: { categories: CategorySlice[]; total: number }) {
  const sum = Math.max(1, categories.reduce((s, c) => s + c.amount, 0))
  const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  return (
    <GlassCard className="p-5 col-span-2 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold" style={{ color: 'var(--on-surface)' }}>Shared Budget</h3>
        <Link href="/budget" className="flex items-center gap-1 text-data-label" style={{ color: 'var(--outline)' }}>
          {month} <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {categories.length > 0 ? (
        <>
          <div className="w-full h-3 rounded-full overflow-hidden flex" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
            {categories.map(c => (
              <div key={c.name} style={{ width: `${(c.amount / sum) * 100}%`, background: c.color }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-data-label" style={{ color: 'var(--on-surface-variant)' }}>
            {categories.map(c => (
              <div key={c.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                <span>{c.name}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-data-label" style={{ color: 'var(--on-surface-variant)' }}>No spending recorded this month yet</p>
      )}

      <div className="pt-2 border-t flex justify-between items-center" style={{ borderColor: 'var(--glass-border)' }}>
        <span className="text-data-label" style={{ color: 'var(--outline)' }}>Spent this month</span>
        <span className="font-mono font-semibold" style={{ color: 'var(--on-surface)' }}>{currency(total)}</span>
      </div>
    </GlassCard>
  )
}
