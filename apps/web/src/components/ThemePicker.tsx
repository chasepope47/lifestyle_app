'use client'
import { useTheme, THEMES, type AccentTheme } from '@/providers/ThemeProvider'

const ACCENT_ORDER: AccentTheme[] = ['violet', 'cyber', 'emerald', 'solar']

export function ThemePicker({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme()

  return (
    <div className={`flex items-center ${compact ? 'gap-1.5' : 'gap-2'}`}>
      {ACCENT_ORDER.map(id => {
        const active = theme === id
        return (
          <button
            key={id}
            title={THEMES[id].label}
            onClick={() => setTheme(id)}
            className="rounded-full transition-transform hover:scale-110 active:scale-95 flex-shrink-0"
            style={{
              width:  compact ? 16 : 20,
              height: compact ? 16 : 20,
              background: THEMES[id].gradient,
              boxShadow: active
                ? `0 0 0 2px #020617, 0 0 0 3.5px ${THEMES[id].accent}`
                : undefined,
              transform: active ? 'scale(1.15)' : undefined,
            }}
            aria-label={`Switch to ${THEMES[id].label} theme`}
          />
        )
      })}
    </div>
  )
}
