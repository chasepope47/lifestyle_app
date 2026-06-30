'use client'
import { createContext, useContext, useEffect, useState } from 'react'

export type AccentTheme = 'violet' | 'rose' | 'ocean' | 'emerald' | 'amber'

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
    accent: '#7c3aed',
    accent2: '#ec4899',
    gradient: 'linear-gradient(135deg, #7c3aed, #ec4899)',
    heroGradient: 'linear-gradient(135deg, #1a0533 0%, #2e0a52 35%, #1a0a2e 65%, #0d0c11 100%)',
    stripeGradient: 'linear-gradient(to bottom, transparent, rgba(124,58,237,0.4) 30%, rgba(236,72,153,0.3) 70%, transparent)',
    label: 'Violet',
  },
  rose: {
    accent: '#e11d48',
    accent2: '#f97316',
    gradient: 'linear-gradient(135deg, #e11d48, #f97316)',
    heroGradient: 'linear-gradient(135deg, #2d010e 0%, #4a0519 35%, #2d0a00 65%, #0d0c11 100%)',
    stripeGradient: 'linear-gradient(to bottom, transparent, rgba(225,29,72,0.4) 30%, rgba(249,115,22,0.3) 70%, transparent)',
    label: 'Rose',
  },
  ocean: {
    accent: '#0ea5e9',
    accent2: '#6366f1',
    gradient: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
    heroGradient: 'linear-gradient(135deg, #01101d 0%, #02173a 35%, #0c0a20 65%, #0d0c11 100%)',
    stripeGradient: 'linear-gradient(to bottom, transparent, rgba(14,165,233,0.4) 30%, rgba(99,102,241,0.3) 70%, transparent)',
    label: 'Ocean',
  },
  emerald: {
    accent: '#10b981',
    accent2: '#2dd4bf',
    gradient: 'linear-gradient(135deg, #10b981, #2dd4bf)',
    heroGradient: 'linear-gradient(135deg, #021a10 0%, #053a22 35%, #021a16 65%, #0d0c11 100%)',
    stripeGradient: 'linear-gradient(to bottom, transparent, rgba(16,185,129,0.4) 30%, rgba(45,212,191,0.3) 70%, transparent)',
    label: 'Emerald',
  },
  amber: {
    accent: '#f59e0b',
    accent2: '#ef4444',
    gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    heroGradient: 'linear-gradient(135deg, #1f1000 0%, #3d1f00 35%, #2d0a00 65%, #0d0c11 100%)',
    stripeGradient: 'linear-gradient(to bottom, transparent, rgba(245,158,11,0.4) 30%, rgba(239,68,68,0.3) 70%, transparent)',
    label: 'Amber',
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
