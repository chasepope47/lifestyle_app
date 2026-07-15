'use client'
import { useEffect, useState } from 'react'

export type WidgetId = 'safeToSpend' | 'health' | 'pantry' | 'sharedBudget' | 'learning'

export const WIDGET_META: Record<WidgetId, { title: string; description: string; icon: string }> = {
  safeToSpend: { title: 'Safe to Spend', description: 'Real-time monthly budget tracker', icon: 'wallet' },
  health: { title: 'Health Hub', description: 'Steps and sleep at a glance', icon: 'health' },
  pantry: { title: 'Pantry Tracker', description: 'Low-stock and expiring items', icon: 'pantry' },
  sharedBudget: { title: 'Shared Budget', description: 'Category spending breakdown', icon: 'budget' },
  learning: { title: 'Learning', description: 'Study streak, certs, and job search', icon: 'learning' },
}

const DEFAULT_ORDER: WidgetId[] = ['safeToSpend', 'health', 'pantry', 'sharedBudget', 'learning']
const STORAGE_KEY = 'lifestyle-dashboard-layout'

interface StoredLayout {
  order: WidgetId[]
  hidden: WidgetId[]
}

function isValid(order: unknown): order is WidgetId[] {
  return Array.isArray(order) && order.every(id => DEFAULT_ORDER.includes(id as WidgetId)) && order.length === DEFAULT_ORDER.length
}

export function useDashboardLayout() {
  const [order, setOrder] = useState<WidgetId[]>(DEFAULT_ORDER)
  const [hidden, setHidden] = useState<Set<WidgetId>>(new Set())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as StoredLayout
        if (isValid(parsed.order)) setOrder(parsed.order)
        if (Array.isArray(parsed.hidden)) setHidden(new Set(parsed.hidden))
      }
    } catch {
      // ignore malformed storage
    }
    setLoaded(true)
  }, [])

  const persist = (nextOrder: WidgetId[], nextHidden: Set<WidgetId>) => {
    setOrder(nextOrder)
    setHidden(nextHidden)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ order: nextOrder, hidden: Array.from(nextHidden) }))
  }

  const toggleWidget = (id: WidgetId) => {
    const next = new Set(hidden)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    persist(order, next)
  }

  const reorder = (from: number, to: number) => {
    const next = [...order]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    persist(next, hidden)
  }

  const reset = () => persist(DEFAULT_ORDER, new Set())

  return {
    loaded,
    order,
    hidden,
    visibleOrder: order.filter(id => !hidden.has(id)),
    toggleWidget,
    reorder,
    reset,
  }
}
