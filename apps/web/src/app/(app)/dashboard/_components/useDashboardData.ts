'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getExpirationStatus } from '@lifestyle/shared'
import { useHousehold } from '@/providers/HouseholdProvider'
import { useAuth } from '@/providers/AuthProvider'

export interface DailySpend {
  date: string
  amount: number
}

export interface CategorySlice {
  name: string
  color: string
  amount: number
}

export interface PantryLowItem {
  id: string
  name: string
}

export interface DashboardData {
  loading: boolean
  safeToSpend: number
  dailySpend: DailySpend[]
  spendVelocityPct: number | null
  totalSpentThisMonth: number
  categoryBreakdown: CategorySlice[]
  pantryLowItems: PantryLowItem[]
  steps: number | null
  stepsDate: string | null
}

function monthBounds(date: Date) {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const startDate = `${y}-${String(m).padStart(2, '0')}-01`
  const endDate = new Date(y, m, 0).toISOString().slice(0, 10)
  return { startDate, endDate }
}

export function useDashboardData(): DashboardData {
  const { householdId } = useHousehold()
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData>({
    loading: true,
    safeToSpend: 0,
    dailySpend: [],
    spendVelocityPct: null,
    totalSpentThisMonth: 0,
    categoryBreakdown: [],
    pantryLowItems: [],
    steps: null,
    stepsDate: null,
  })

  useEffect(() => {
    if (!householdId) return
    const hid = householdId
    const supabase = createClient()
    let cancelled = false

    async function load() {
      const now = new Date()
      const { startDate, endDate } = monthBounds(now)
      const twelveDaysAgo = new Date(now)
      twelveDaysAgo.setDate(twelveDaysAgo.getDate() - 11)

      const [monthTxRes, velocityTxRes, catRes, pantryRes, healthRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('amount, category_id')
          .eq('household_id', hid)
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate),
        supabase
          .from('transactions')
          .select('amount, transaction_date')
          .eq('household_id', hid)
          .gte('transaction_date', twelveDaysAgo.toISOString().slice(0, 10))
          .lte('transaction_date', now.toISOString().slice(0, 10)),
        supabase
          .from('budget_categories')
          .select('id, name, color, is_income')
          .eq('household_id', hid),
        supabase
          .from('pantry_items')
          .select('id, name, quantity, expiration_date')
          .eq('household_id', hid),
        user
          ? supabase
              .from('health_metrics')
              .select('steps, metric_date')
              .eq('user_id', user.id)
              .not('steps', 'is', null)
              .order('metric_date', { ascending: false })
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ])

      if (cancelled) return

      // Safe to spend: income - expenses for the current month
      let income = 0
      let expenses = 0
      const spendByCategory: Record<string, number> = {}
      for (const tx of monthTxRes.data ?? []) {
        if (tx.amount > 0) income += tx.amount
        else {
          expenses += Math.abs(tx.amount)
          if (tx.category_id) spendByCategory[tx.category_id] = (spendByCategory[tx.category_id] ?? 0) + Math.abs(tx.amount)
        }
      }

      // Daily spend velocity — last 12 calendar days, oldest to newest
      const dayMap: Record<string, number> = {}
      for (const tx of velocityTxRes.data ?? []) {
        if (tx.amount >= 0) continue
        dayMap[tx.transaction_date] = (dayMap[tx.transaction_date] ?? 0) + Math.abs(tx.amount)
      }
      const dailySpend: DailySpend[] = []
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const key = d.toISOString().slice(0, 10)
        dailySpend.push({ date: key, amount: dayMap[key] ?? 0 })
      }
      const lastHalf = dailySpend.slice(6).reduce((s, d) => s + d.amount, 0)
      const firstHalf = dailySpend.slice(0, 6).reduce((s, d) => s + d.amount, 0)
      const spendVelocityPct = firstHalf > 0 ? Math.round(((lastHalf - firstHalf) / firstHalf) * 100) : null

      // Category breakdown — top 2 expense categories + "Other"
      const categories = (catRes.data ?? []).filter(c => !c.is_income)
      const ranked = categories
        .map(c => ({ name: c.name, color: c.color ?? 'var(--accent)', amount: spendByCategory[c.id] ?? 0 }))
        .filter(c => c.amount > 0)
        .sort((a, b) => b.amount - a.amount)
      const top = ranked.slice(0, 2)
      const otherAmount = ranked.slice(2).reduce((s, c) => s + c.amount, 0)
      const categoryBreakdown: CategorySlice[] = [...top]
      if (otherAmount > 0) categoryBreakdown.push({ name: 'Other', color: 'var(--outline)', amount: otherAmount })

      // Pantry low: out of stock, or expiring soon/critical/expired
      const pantryLowItems: PantryLowItem[] = (pantryRes.data ?? [])
        .filter(i => {
          const isEmpty = i.quantity != null && i.quantity <= 0
          return isEmpty || ['expired', 'critical', 'soon'].includes(getExpirationStatus(i.expiration_date))
        })
        .map(i => ({ id: i.id, name: i.name }))

      const health = healthRes.data as { steps: number | null; metric_date: string } | null

      setData({
        loading: false,
        safeToSpend: income - expenses,
        dailySpend,
        spendVelocityPct,
        totalSpentThisMonth: expenses,
        categoryBreakdown,
        pantryLowItems,
        steps: health?.steps ?? null,
        stepsDate: health?.metric_date ?? null,
      })
    }

    load()
    return () => { cancelled = true }
  }, [householdId, user])

  return data
}
