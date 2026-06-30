'use client'
import { useState, useRef } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Home, ShoppingBag, TrendingUp, ArrowLeftRight } from 'lucide-react'
import { formatCurrency } from '@lifestyle/shared'
import type { Database } from '@lifestyle/db'

type Transaction = Database['public']['Tables']['transactions']['Row']
type SwipeDirection = 'up' | 'down' | 'left' | 'right'
type SwipeConfig = Record<SwipeDirection, string>

const CATEGORY_BUTTONS = [
  { key: 'needs', label: 'Needs', Icon: Home, bg: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800' },
  { key: 'wants', label: 'Wants', Icon: ShoppingBag, bg: 'bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700' },
  { key: 'savings', label: 'Savings', Icon: TrendingUp, bg: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800' },
  { key: 'transfers', label: 'Transfers', Icon: ArrowLeftRight, bg: 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800' },
] as const

const SWIPE_LABEL = {
  needs: { label: 'Needs', color: 'text-blue-400' },
  wants: { label: 'Wants', color: 'text-yellow-400' },
  savings: { label: 'Savings', color: 'text-emerald-400' },
  transfers: { label: 'Transfers', color: 'text-purple-400' },
}

interface ReviewViewProps {
  unreviewed: Transaction[]
  onCategorize: (txId: string, category: string) => Promise<void>
  onBack: () => void
}

export function ReviewView({ unreviewed, onCategorize, onBack }: ReviewViewProps) {
  const [reviewIndex, setReviewIndex] = useState(0)
  const [swipeConfig] = useState<SwipeConfig>({ up: 'needs', down: 'savings', left: 'wants', right: 'transfers' })
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection | null>(null)
  const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 })
  const [isProcessing, setIsProcessing] = useState(false)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const current = unreviewed[Math.min(reviewIndex, unreviewed.length - 1)]
  const total = unreviewed.length
  const progress = total > 0 ? ((reviewIndex + 1) / total) * 100 : 0

  const handleCategorize = async (category: string) => {
    if (!current || isProcessing) return
    setIsProcessing(true)
    try {
      await onCategorize(current.id, category)
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
    const category = swipeConfig[dir]
    setTimeout(() => handleCategorize(category), 200)
  }

  if (!current) return null

  return (
    <div className="px-3 sm:px-4 py-6 sm:py-8 max-w-2xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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
      <p className="text-center text-xs text-stone-500 dark:text-stone-400 mb-6">
        {reviewIndex + 1} of {total}
      </p>

      {/* Transaction card (swipeable) */}
      <div
        className="relative rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 mb-6 touch-none select-none cursor-grab active:cursor-grabbing"
        style={{
          transform: `translate(${swipeOffset.x * 0.25}px, ${swipeOffset.y * 0.25}px) rotate(${swipeOffset.x * 0.015}deg)`,
          transition: swipeOffset.x === 0 && swipeOffset.y === 0 ? 'transform 0.25s ease' : 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipe overlay label */}
        {swipeDirection && (
          <div className={`absolute inset-0 flex items-center justify-center rounded-2xl bg-black/10 dark:bg-white/10 ${SWIPE_LABEL[swipeDirection as keyof typeof SWIPE_LABEL]?.color ?? ''} text-4xl font-black uppercase tracking-widest pointer-events-none`}>
            {SWIPE_LABEL[swipeDirection as keyof typeof SWIPE_LABEL]?.label}
          </div>
        )}

        <div className="flex gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-lg">
            {(current.description || 'TX').substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-semibold text-stone-900 dark:text-stone-50 leading-tight">{current.description}</p>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              {new Date(current.transaction_date + 'T00:00:00').toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </p>
            {current.merchant && (
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5 truncate">{current.merchant}</p>
            )}
          </div>
        </div>

        <p className={`text-3xl font-bold ${current.amount >= 0 ? 'text-emerald-500' : 'text-stone-900 dark:text-stone-50'}`}>
          {current.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(current.amount))}
        </p>
      </div>

      {/* Prev / Next */}
      <div className="flex items-center justify-between mb-6 gap-2">
        <button
          onClick={() => setReviewIndex(i => Math.max(0, i - 1))}
          disabled={reviewIndex === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>
        <button
          onClick={() => {
            if (reviewIndex < total - 1) setReviewIndex(i => i + 1)
            else onBack()
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors text-sm font-medium"
        >
          {reviewIndex < total - 1 ? 'Next' : 'Done'} <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Category buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {CATEGORY_BUTTONS.map(({ key, label, Icon, bg }) => (
          <button
            key={key}
            onClick={() => handleCategorize(key)}
            disabled={isProcessing}
            className={`flex flex-col items-center gap-2.5 py-5 rounded-2xl ${bg} text-white font-semibold transition-all disabled:opacity-60 active:scale-95`}
          >
            <Icon className="w-6 h-6" />
            {label}
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-stone-400 dark:text-stone-600">
        Swipe the card to categorize quickly
      </p>
    </div>
  )
}
