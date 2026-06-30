'use client'
import { useState, useRef } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@lifestyle/shared'
import type { Database } from '@lifestyle/db'
import type { EnvelopeCategory } from './CategoryEnvelopeGrid'

type Transaction = Database['public']['Tables']['transactions']['Row']
type SwipeDirection = 'up' | 'down' | 'left' | 'right'

const SWIPE_DIRS: SwipeDirection[] = ['up', 'down', 'left', 'right']

interface CatOption {
  id: string
  name: string
  color: string
  icon?: string | null
}

const FALLBACK_CATS: CatOption[] = [
  { id: 'needs',     name: 'Needs',     color: '#2563eb' },
  { id: 'wants',     name: 'Wants',     color: '#ca8a04' },
  { id: 'savings',   name: 'Savings',   color: '#059669' },
  { id: 'transfers', name: 'Transfers', color: '#7c3aed' },
]

interface ReviewViewProps {
  unreviewed: Transaction[]
  envelopeCategories?: EnvelopeCategory[]
  onCategorize: (txId: string, category: string, categoryId?: string) => Promise<void>
  onBack: () => void
}

export function ReviewView({ unreviewed, envelopeCategories, onCategorize, onBack }: ReviewViewProps) {
  const [reviewIndex, setReviewIndex] = useState(0)
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection | null>(null)
  const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 })
  const [isProcessing, setIsProcessing] = useState(false)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const useEnvelopes = (envelopeCategories?.length ?? 0) > 0
  const cats: CatOption[] = useEnvelopes
    ? envelopeCategories!.map(c => ({ id: c.id, name: c.name, color: c.color ?? '#7c3aed', icon: c.icon }))
    : FALLBACK_CATS
  const swipeCats = cats.slice(0, 4)

  const current = unreviewed[Math.min(reviewIndex, unreviewed.length - 1)]
  const total = unreviewed.length
  const progress = total > 0 ? ((reviewIndex + 1) / total) * 100 : 0

  const handleCategorize = async (cat: CatOption) => {
    if (!current || isProcessing) return
    setIsProcessing(true)
    try {
      const categoryValue = useEnvelopes ? cat.name : cat.id
      const categoryId = useEnvelopes ? cat.id : undefined
      await onCategorize(current.id, categoryValue, categoryId)
    } finally {
      setIsProcessing(false)
      setSwipeDirection(null)
      setSwipeOffset({ x: 0, y: 0 })
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    setSwipeDirection(null)
    setSwipeOffset({ x: 0, y: 0 })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    setSwipeOffset({
      x: e.touches[0].clientX - touchStartRef.current.x,
      y: e.touches[0].clientY - touchStartRef.current.y,
    })
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    const diffX = e.changedTouches[0].clientX - touchStartRef.current.x
    const diffY = e.changedTouches[0].clientY - touchStartRef.current.y
    setSwipeOffset({ x: 0, y: 0 })
    touchStartRef.current = null
    if (Math.abs(diffX) < 50 && Math.abs(diffY) < 50) return
    const dir: SwipeDirection =
      Math.abs(diffX) > Math.abs(diffY)
        ? diffX > 0 ? 'right' : 'left'
        : diffY > 0 ? 'down' : 'up'
    setSwipeDirection(dir)
    const cat = swipeCats[SWIPE_DIRS.indexOf(dir)]
    if (cat) setTimeout(() => handleCategorize(cat), 200)
  }

  const swipeLabel = swipeDirection != null ? (swipeCats[SWIPE_DIRS.indexOf(swipeDirection)] ?? null) : null

  if (!current) return null

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-6 max-w-2xl mx-auto pb-20 flex flex-col min-h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5 text-stone-600 dark:text-stone-400" />
        </button>
        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">Categorize</h1>
        <div className="w-9" />
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full mb-2 overflow-hidden">
        <div
          className="h-full bg-violet-500 rounded-full transition-all duration-400"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-center text-xs text-stone-500 dark:text-stone-400 mb-3">
        {reviewIndex + 1} of {total}
      </p>

      {/* Transaction card (swipeable) */}
      <div
        className="relative rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 sm:p-5 mb-3 touch-none select-none cursor-grab active:cursor-grabbing flex-shrink-0"
        style={{
          transform: `translate(${swipeOffset.x * 0.25}px, ${swipeOffset.y * 0.25}px) rotate(${swipeOffset.x * 0.015}deg)`,
          transition: swipeOffset.x === 0 && swipeOffset.y === 0 ? 'transform 0.25s ease' : 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipe overlay label */}
        {swipeLabel && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-2xl text-4xl font-black uppercase tracking-widest pointer-events-none"
            style={{ background: `${swipeLabel.color}22`, color: swipeLabel.color }}
          >
            {swipeLabel.icon ? swipeLabel.icon : swipeLabel.name}
          </div>
        )}

        <div className="flex gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-base">
            {(current.description || 'TX').substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-stone-900 dark:text-stone-50 leading-tight truncate">{current.description}</p>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              {new Date(current.transaction_date + 'T00:00:00').toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </p>
            {current.merchant && (
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5 truncate">{current.merchant}</p>
            )}
          </div>
          <p className={`text-xl font-bold flex-shrink-0 ${current.amount >= 0 ? 'text-emerald-500' : 'text-stone-900 dark:text-stone-50'}`}>
            {current.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(current.amount))}
          </p>
        </div>
      </div>

      {/* Prev / Next */}
      <div className="flex items-center justify-between mb-3 gap-2 flex-shrink-0">
        <button
          onClick={() => setReviewIndex(i => Math.max(0, i - 1))}
          disabled={reviewIndex === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>
        <button
          onClick={() => {
            if (reviewIndex < total - 1) setReviewIndex(i => i + 1)
            else onBack()
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors text-xs font-medium"
        >
          {reviewIndex < total - 1 ? 'Next' : 'Done'} <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Category buttons — fills remaining space, no inner scroll */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2 flex-1 auto-rows-fr"
      >
        {cats.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleCategorize(cat)}
            disabled={isProcessing}
            className="flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-2xl text-white font-semibold transition-all disabled:opacity-60 active:scale-95 text-xs text-center"
            style={{
              background: `linear-gradient(135deg, ${cat.color}dd, ${cat.color}88)`,
              boxShadow: `0 4px 12px ${cat.color}33`,
            }}
          >
            {cat.icon ? (
              <span className="text-xl leading-none flex-shrink-0">{cat.icon}</span>
            ) : (
              <span className="w-4 h-4 rounded-full bg-white/30 flex-shrink-0" />
            )}
            <span className="truncate w-full">{cat.name}</span>
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-stone-400 dark:text-stone-600 flex-shrink-0">
        Swipe the card · first 4 categories mapped to directions
      </p>
    </div>
  )
}
