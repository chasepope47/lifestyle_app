'use client'
import { useState } from 'react'
import { X, Palette, LayoutGrid, GripVertical, Wallet, HeartPulse, ShoppingBasket, PieChart } from 'lucide-react'
import { useTheme, THEMES, type AccentTheme } from '@/providers/ThemeProvider'
import { Toggle } from '@/components/ui/Toggle'
import { WIDGET_META, type WidgetId } from './useDashboardLayout'

const ACCENT_ORDER: AccentTheme[] = ['violet', 'cyber', 'emerald', 'solar']

const WIDGET_ICONS: Record<WidgetId, typeof Wallet> = {
  safeToSpend: Wallet,
  health: HeartPulse,
  pantry: ShoppingBasket,
  sharedBudget: PieChart,
}

export function CustomizeModal({
  order,
  hidden,
  onToggle,
  onReorder,
  onReset,
  onClose,
}: {
  order: WidgetId[]
  hidden: Set<WidgetId>
  onToggle: (id: WidgetId) => void
  onReorder: (from: number, to: number) => void
  onReset: () => void
  onClose: () => void
}) {
  const { theme, setTheme } = useTheme()
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="glass-card rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <header
          className="flex items-center justify-between px-5 h-16 flex-shrink-0 border-b"
          style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--surface-container)' }}
        >
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--accent)' }}>Customize Experience</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors" aria-label="Close">
            <X className="w-4 h-4" style={{ color: 'var(--on-surface-variant)' }} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-8">
          {/* Theme colors */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-3.5 h-3.5" style={{ color: 'var(--accent2)' }} />
              <h3 className="text-data-label uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>Theme Colors</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {ACCENT_ORDER.map(id => {
                const active = theme === id
                return (
                  <button
                    key={id}
                    onClick={() => setTheme(id)}
                    className="rounded-xl p-3 flex flex-col gap-3 border text-left transition-all"
                    style={{
                      backgroundColor: 'var(--surface-container-high)',
                      borderColor: active ? THEMES[id].accent : 'var(--glass-border)',
                      boxShadow: active ? `0 0 0 1px ${THEMES[id].accent}` : undefined,
                    }}
                  >
                    <div className="flex gap-1">
                      <div className="w-4 h-4 rounded-full" style={{ background: THEMES[id].accent, boxShadow: `0 0 8px ${THEMES[id].accent}99` }} />
                      <div className="w-4 h-4 rounded-full" style={{ background: THEMES[id].accent2, opacity: 0.6 }} />
                    </div>
                    <span className="text-data-label font-mono" style={{ color: active ? THEMES[id].accent : 'var(--on-surface-variant)' }}>
                      {THEMES[id].label}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Widget layout */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <LayoutGrid className="w-3.5 h-3.5" style={{ color: 'var(--accent2)' }} />
              <h3 className="text-data-label uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>Widget Layout</h3>
            </div>
            <div className="space-y-2">
              {order.map((id, index) => {
                const Icon = WIDGET_ICONS[id]
                const isHidden = hidden.has(id)
                return (
                  <div
                    key={id}
                    draggable
                    onDragStart={() => setDragIndex(index)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => {
                      if (dragIndex !== null && dragIndex !== index) onReorder(dragIndex, index)
                      setDragIndex(null)
                    }}
                    onDragEnd={() => setDragIndex(null)}
                    className="rounded-xl p-3 flex items-center gap-3 border transition-opacity"
                    style={{
                      backgroundColor: 'var(--surface-container-high)',
                      borderColor: 'var(--glass-border)',
                      opacity: isHidden ? 0.5 : 1,
                    }}
                  >
                    <GripVertical className="w-4 h-4 cursor-grab active:cursor-grabbing flex-shrink-0" style={{ color: 'var(--outline)' }} />
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}
                    >
                      <Icon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold truncate" style={{ color: 'var(--on-surface)' }}>{WIDGET_META[id].title}</h4>
                      <p className="text-data-label truncate" style={{ color: 'var(--on-surface-variant)' }}>{WIDGET_META[id].description}</p>
                    </div>
                    <Toggle checked={!isHidden} onChange={() => onToggle(id)} label={`Toggle ${WIDGET_META[id].title}`} />
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        <footer
          className="flex-shrink-0 p-4 flex gap-3 border-t"
          style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--surface-container)' }}
        >
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl font-semibold text-sm transition-transform hover:scale-[1.02] active:scale-95"
            style={{ background: 'var(--brand-gradient)', color: '#fff' }}
          >
            Done
          </button>
          <button
            onClick={onReset}
            className="px-5 h-11 rounded-xl text-sm font-medium border transition-colors hover:bg-white/10"
            style={{ borderColor: 'var(--glass-border)', color: 'var(--on-surface-variant)' }}
          >
            Reset
          </button>
        </footer>
      </div>
    </div>
  )
}
