'use client'
import { useState } from 'react'
import { Search, X, MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react'
import { formatCurrency } from '@lifestyle/shared'
import type { Database } from '@lifestyle/db'
import type { EnvelopeCategory } from './CategoryEnvelopeGrid'

type Transaction = Database['public']['Tables']['transactions']['Row']

interface CatOption {
  id: string
  name: string
  color: string
  icon?: string | null
}

const LEGACY_CATS: CatOption[] = [
  { id: 'needs',     name: 'Needs',     color: '#60a5fa' },
  { id: 'wants',     name: 'Wants',     color: '#fbbf24' },
  { id: 'savings',   name: 'Savings',   color: '#34d399' },
  { id: 'transfers', name: 'Transfers', color: '#c084fc' },
]

interface TransactionListProps {
  transactions: Transaction[]
  envelopeCategories?: EnvelopeCategory[]
  onCategoryChange: (txId: string, category: string, categoryId?: string) => void
  onReviewClick: () => void
}

export function TransactionList({ transactions, envelopeCategories, onCategoryChange, onReviewClick }: TransactionListProps) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const PAGE_SIZE = 10

  const useEnvelopes = (envelopeCategories?.length ?? 0) > 0
  const cats: CatOption[] = useEnvelopes
    ? envelopeCategories!.map(c => ({ id: c.id, name: c.name, color: c.color ?? '#7c3aed', icon: c.icon }))
    : LEGACY_CATS
  const catById = new Map(cats.map(c => [c.id, c]))

  // Resolve the category a transaction is shown under: envelope (category_id) takes priority, then legacy text category
  const catFor = (t: Transaction): CatOption | null => {
    if (t.category_id && catById.has(t.category_id)) return catById.get(t.category_id)!
    if (!useEnvelopes && t.category && catById.has(t.category)) return catById.get(t.category)!
    return null
  }
  const isUncategorized = (t: Transaction) => !t.category && !t.category_id

  const TABS: { key: string; label: string }[] = [
    { key: 'all', label: 'All' },
    ...cats.map(c => ({ key: c.id, label: c.name })),
    { key: 'uncategorized', label: 'Uncategorized' },
  ]

  const filtered = transactions.filter(t => {
    const matchSearch = !search ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      (t.merchant?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchFilter =
      activeFilter === 'all' ? true :
      activeFilter === 'uncategorized' ? isUncategorized(t) :
      useEnvelopes ? t.category_id === activeFilter : t.category === activeFilter
    return matchSearch && matchFilter
  })

  const displayed = expanded ? filtered : filtered.slice(0, PAGE_SIZE)
  const uncategorizedCount = transactions.filter(isUncategorized).length

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
            const cat = catFor(tx)
            const initials = (tx.description || 'TX').substring(0, 2).toUpperCase()
            const isPositive = tx.amount >= 0
            const selectedId = tx.category_id ?? tx.category ?? null

            return (
              <div
                key={tx.id}
                className="relative flex items-center gap-3 px-5 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group"
              >
                {/* Category left accent bar */}
                {cat && (
                  <div
                    className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                )}

                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-xs"
                  style={{
                    background: cat
                      ? `linear-gradient(135deg, ${cat.color}cc, ${cat.color}88)`
                      : 'linear-gradient(135deg, #78716c, #57534e)',
                    boxShadow: cat ? `0 2px 8px ${cat.color}44` : undefined,
                  }}
                >
                  {cat?.icon ? <span className="text-base">{cat.icon}</span> : initials}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-50 truncate leading-tight">{tx.description}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-xs text-stone-400">
                      {new Date(tx.transaction_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    {cat ? (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{ color: cat.color, backgroundColor: `${cat.color}1a` }}
                      >
                        {cat.name}
                      </span>
                    ) : (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20">
                        uncategorized
                      </span>
                    )}
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
                    <div className="absolute right-0 top-9 z-20 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl shadow-xl p-1.5 min-w-[156px] max-h-72 overflow-y-auto">
                      <p className="text-xs text-stone-400 px-2.5 py-1.5 font-medium">Set category</p>
                      {cats.map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            const categoryValue = useEnvelopes ? c.name : c.id
                            const categoryId = useEnvelopes ? c.id : undefined
                            onCategoryChange(tx.id, categoryValue, categoryId)
                            setMenuOpenId(null)
                          }}
                          className={`w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm transition-colors ${
                            selectedId === c.id
                              ? 'bg-stone-100 dark:bg-stone-700 text-stone-900 dark:text-stone-50 font-medium'
                              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'
                          }`}
                        >
                          {c.icon ? (
                            <span className="text-sm flex-shrink-0">{c.icon}</span>
                          ) : (
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                          )}
                          <span className="truncate">{c.name}</span>
                          {selectedId === c.id && <span className="ml-auto text-xs text-stone-400">✓</span>}
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
