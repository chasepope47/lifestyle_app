'use client'
import { useState } from 'react'
import { Search, X, MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react'
import { formatCurrency } from '@lifestyle/shared'
import type { Database } from '@lifestyle/db'

type Transaction = Database['public']['Tables']['transactions']['Row']
type FilterTab = 'all' | 'needs' | 'wants' | 'savings' | 'transfers' | 'uncategorized'

const CATEGORY_META = {
  needs:     { bg: '#60a5fa', label: 'Needs',     pill: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' },
  wants:     { bg: '#fbbf24', label: 'Wants',     pill: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30' },
  savings:   { bg: '#34d399', label: 'Savings',   pill: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' },
  transfers: { bg: '#c084fc', label: 'Transfers', pill: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30' },
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
    <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-sm mb-6 overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-50">Transactions</h3>
            <p className="text-xs text-stone-400 mt-0.5">{transactions.length} this month</p>
          </div>
          {uncategorizedCount > 0 && (
            <button
              onClick={onReviewClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
              style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: '#d97706' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
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
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-stone-400 hover:text-stone-600" />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(tab => {
            const isActive = activeFilter === tab.key
            const count = tab.key === 'uncategorized' ? uncategorizedCount : undefined
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {tab.label}
                {count != null && count > 0 && (
                  <span className={`ml-1 text-xs ${isActive ? 'opacity-70' : 'text-amber-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Rows */}
      {menuOpenId && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
      )}

      <div className="divide-y divide-stone-50 dark:divide-stone-800/60">
        {filtered.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-8">No transactions match</p>
        ) : (
          displayed.map(tx => {
            const meta = tx.category ? CATEGORY_META[tx.category as keyof typeof CATEGORY_META] : null
            const initials = (tx.description || 'TX').substring(0, 2).toUpperCase()
            const isPositive = tx.amount >= 0

            return (
              <div
                key={tx.id}
                className="relative flex items-center gap-3 px-5 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group"
              >
                {/* Category left accent bar */}
                {meta && (
                  <div
                    className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                    style={{ backgroundColor: meta.bg }}
                  />
                )}

                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-xs"
                  style={{
                    background: meta
                      ? `linear-gradient(135deg, ${meta.bg}cc, ${meta.bg}88)`
                      : 'linear-gradient(135deg, #78716c, #57534e)',
                    boxShadow: meta ? `0 2px 8px ${meta.bg}44` : undefined,
                  }}
                >
                  {initials}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-50 truncate leading-tight">{tx.description}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-xs text-stone-400">
                      {new Date(tx.transaction_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    {tx.category && meta ? (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${meta.pill}`}>
                        {meta.label}
                      </span>
                    ) : !tx.category ? (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20">
                        uncategorized
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Amount */}
                <p className={`text-sm font-bold flex-shrink-0 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-900 dark:text-stone-100'}`}>
                  {isPositive ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                </p>

                {/* Context menu */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setMenuOpenId(menuOpenId === tx.id ? null : tx.id)}
                    className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:bg-stone-100 dark:hover:bg-stone-700"
                  >
                    <MoreHorizontal className="w-4 h-4 text-stone-400" />
                  </button>
                  {menuOpenId === tx.id && (
                    <div className="absolute right-0 top-9 z-20 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl shadow-xl p-1.5 min-w-[156px]">
                      <p className="text-xs text-stone-400 px-2.5 py-1.5 font-medium">Set category</p>
                      {Object.entries(CATEGORY_META).map(([cat, m]) => (
                        <button
                          key={cat}
                          onClick={() => { onCategoryChange(tx.id, cat); setMenuOpenId(null) }}
                          className={`w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm transition-colors ${
                            tx.category === cat
                              ? 'bg-stone-100 dark:bg-stone-700 text-stone-900 dark:text-stone-50 font-medium'
                              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'
                          }`}
                        >
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: m.bg }} />
                          <span className="capitalize">{cat}</span>
                          {tx.category === cat && <span className="ml-auto text-xs text-stone-400">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Show more / less */}
      {filtered.length > PAGE_SIZE && (
        <div className="px-5 py-3 border-t border-stone-100 dark:border-stone-800">
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-center gap-1.5 text-sm text-violet-600 dark:text-violet-400 font-medium hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
          >
            {expanded ? (
              <><ChevronUp className="w-4 h-4" /> Show less</>
            ) : (
              <><ChevronDown className="w-4 h-4" /> {filtered.length - PAGE_SIZE} more transactions</>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
