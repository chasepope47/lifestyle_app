'use client'
import { useState } from 'react'
import { Search, X, MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react'
import { formatCurrency } from '@lifestyle/shared'
import type { Database } from '@lifestyle/db'

type Transaction = Database['public']['Tables']['transactions']['Row']

type FilterTab = 'all' | 'needs' | 'wants' | 'savings' | 'transfers' | 'uncategorized'

const CATEGORY_COLORS = {
  needs: { bg: '#3b82f6', text: 'text-blue-500' },
  wants: { bg: '#eab308', text: 'text-yellow-500' },
  savings: { bg: '#22c55e', text: 'text-emerald-500' },
  transfers: { bg: '#a855f7', text: 'text-purple-500' },
}

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'needs', label: 'Needs' },
  { key: 'wants', label: 'Wants' },
  { key: 'savings', label: 'Savings' },
  { key: 'transfers', label: 'Transfers' },
  { key: 'uncategorized', label: 'Uncategorized' },
]

interface TransactionListProps {
  transactions: Transaction[]
  onCategoryChange: (txId: string, category: string) => void
  onReviewClick: () => void
}

export function TransactionList({ transactions, onCategoryChange, onReviewClick }: TransactionListProps) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const PAGE_SIZE = 10

  const filtered = transactions.filter(t => {
    const matchSearch = !search ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      (t.merchant?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchFilter =
      activeFilter === 'all' ? true :
      activeFilter === 'uncategorized' ? !t.category :
      t.category === activeFilter
    return matchSearch && matchFilter
  })

  const displayed = expanded ? filtered : filtered.slice(0, PAGE_SIZE)
  const uncategorizedCount = transactions.filter(t => !t.category).length

  return (
    <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-stone-900 dark:text-stone-50">Transactions</h3>
          <p className="text-xs text-stone-500 mt-0.5">{transactions.length} this month</p>
        </div>
        {uncategorizedCount > 0 && (
          <button
            onClick={onReviewClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
          >
            Review {uncategorizedCount}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          placeholder="Search transactions…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-9 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-stone-400"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-stone-400 hover:text-stone-600" />
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(tab => {
          const isActive = activeFilter === tab.key
          const count = tab.key === 'uncategorized' ? uncategorizedCount : undefined
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-violet-600 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {tab.label}
              {count != null && count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${isActive ? 'bg-white/20' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Transaction rows */}
      {menuOpenId && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-stone-400 text-center py-6">No transactions match your filter</p>
      ) : (
        <div className="space-y-0.5">
          {displayed.map(tx => {
            const catInfo = tx.category ? CATEGORY_COLORS[tx.category as keyof typeof CATEGORY_COLORS] : null
            const initials = (tx.description || 'TX').substring(0, 2).toUpperCase()
            const isPositive = tx.amount >= 0

            return (
              <div
                key={tx.id}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors group"
              >
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: catInfo ? catInfo.bg : '#a8a29e' }}
                >
                  {initials}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-50 truncate">{tx.description}</p>
                  <p className="text-xs text-stone-500">
                    {new Date(tx.transaction_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {tx.category && (
                      <span className={`ml-1.5 capitalize ${catInfo?.text ?? 'text-stone-400'}`}>· {tx.category}</span>
                    )}
                    {!tx.category && <span className="ml-1.5 text-amber-500">· uncategorized</span>}
                  </p>
                </div>

                {/* Amount */}
                <p className={`text-sm font-semibold flex-shrink-0 ${isPositive ? 'text-emerald-500' : 'text-stone-900 dark:text-stone-50'}`}>
                  {isPositive ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                </p>

                {/* Category menu */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setMenuOpenId(menuOpenId === tx.id ? null : tx.id)}
                    className="p-1 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <MoreHorizontal className="w-4 h-4 text-stone-500" />
                  </button>
                  {menuOpenId === tx.id && (
                    <div className="absolute right-0 top-8 z-20 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-xl shadow-xl p-1.5 min-w-[152px]">
                      <p className="text-xs text-stone-400 px-2 py-1 mb-0.5">Set category</p>
                      {(['needs', 'wants', 'savings', 'transfers'] as const).map(cat => (
                        <button
                          key={cat}
                          onClick={() => { onCategoryChange(tx.id, cat); setMenuOpenId(null) }}
                          className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                            tx.category === cat
                              ? 'bg-stone-100 dark:bg-stone-700 text-stone-900 dark:text-stone-50'
                              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                          }`}
                        >
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: CATEGORY_COLORS[cat].bg }}
                          />
                          <span className="capitalize">{cat}</span>
                          {tx.category === cat && <span className="ml-auto text-xs text-stone-400">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Show more / less */}
      {filtered.length > PAGE_SIZE && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full mt-3 flex items-center justify-center gap-1.5 text-sm text-violet-600 dark:text-violet-400 font-medium hover:text-violet-700 dark:hover:text-violet-300 transition-colors py-1"
        >
          {expanded ? (
            <><ChevronUp className="w-4 h-4" /> Show less</>
          ) : (
            <><ChevronDown className="w-4 h-4" /> Show {filtered.length - PAGE_SIZE} more</>
          )}
        </button>
      )}
    </div>
  )
}
