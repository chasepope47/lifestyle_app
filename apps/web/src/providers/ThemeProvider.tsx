'use client'
import { createContext, useContext, useEffect, useState } from 'react'

export type AccentTheme = 'violet' | 'cyber' | 'emerald' | 'solar'

interface ThemeTokens {
  accent: string
  accent2: string
  gradient: string
  heroGradient: string
  stripeGradient: string
  label: string
}

export const THEMES: Record<AccentTheme, ThemeTokens> = {
  violet: {
    accent: '#8b5cf6',
    accent2: '#22d3ee',
    gradient: 'linear-gradient(135deg, #8b5cf6, #22d3ee)',
    heroGradient: 'linear-gradient(135deg, #1a0533 0%, #1e1b4b 35%, #0a1d2e 65%, #020617 100%)',
    stripeGradient: 'linear-gradient(to bottom, transparent, rgba(139,92,246,0.4) 30%, rgba(34,211,238,0.3) 70%, transparent)',
    label: 'Neon Violet',
  },
  cyber: {
    accent: '#4cd7f6',
    accent2: '#6366f1',
    gradient: 'linear-gradient(135deg, #4cd7f6, #6366f1)',
    heroGradient: 'linear-gradient(135deg, #01101d 0%, #0c1a3d 35%, #150a3a 65%, #020617 100%)',
    stripeGradient: 'linear-gradient(to bottom, transparent, rgba(76,215,246,0.4) 30%, rgba(99,102,241,0.3) 70%, transparent)',
    label: 'Cyber Blue',
  },
  emerald: {
    accent: '#34d399',
    accent2: '#0ea5e9',
    gradient: 'linear-gradient(135deg, #34d399, #0ea5e9)',
    heroGradient: 'linear-gradient(135deg, #021a10 0%, #053a22 35%, #021a2e 65%, #020617 100%)',
    stripeGradient: 'linear-gradient(to bottom, transparent, rgba(52,211,153,0.4) 30%, rgba(14,165,233,0.3) 70%, transparent)',
    label: 'Emerald Tech',
  },
  solar: {
    accent: '#fb923c',
    accent2: '#ef4444',
    gradient: 'linear-gradient(135deg, #fb923c, #ef4444)',
    heroGradient: 'linear-gradient(135deg, #1f1000 0%, #3d1f00 35%, #2d0a00 65%, #020617 100%)',
    stripeGradient: 'linear-gradient(to bottom, transparent, rgba(251,146,60,0.4) 30%, rgba(239,68,68,0.3) 70%, transparent)',
    label: 'Solar Orange',
  },
}

interface ThemeCtx {
  theme: AccentTheme
  setTheme: (t: AccentTheme) => void
  tokens: ThemeTokens
}

const Ctx = createContext<ThemeCtx>({ theme: 'violet', setTheme: () => {}, tokens: THEMES.violet })
export const useTheme = () => useContext(Ctx)

function applyTheme(t: AccentTheme) {
  const { accent, accent2, gradient, heroGradient, stripeGradient } = THEMES[t]
  const root = document.documentElement
  root.style.setProperty('--accent', accent)
  root.style.setProperty('--accent2', accent2)
  root.style.setProperty('--brand-gradient', gradient)
  root.style.setProperty('--hero-gradient', heroGradient)
  root.style.setProperty('--stripe-gradient', stripeGradient)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AccentTheme>('violet')

  useEffect(() => {
    const saved = localStorage.getItem('lifestyle-theme') as AccentTheme | null
    const t = saved && THEMES[saved] ? saved : 'violet'
    setThemeState(t)
    applyTheme(t)
  }, [])

  const setTheme = (t: AccentTheme) => {
    setThemeState(t)
    applyTheme(t)
    localStorage.setItem('lifestyle-theme', t)
  }

  return <Ctx.Provider value={{ theme, setTheme, tokens: THEMES[theme] }}>{children}</Ctx.Provider>
}
