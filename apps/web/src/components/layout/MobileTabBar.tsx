'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Wallet, ShoppingBasket, Dumbbell, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { MobileMoreSheet } from './MobileMoreSheet'

const PRIMARY_TABS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home',     color: '#a78bfa' },
  { href: '/budget',    icon: Wallet,          label: 'Budget',   color: '#a78bfa' },
  { href: '/pantry',    icon: ShoppingBasket,  label: 'Pantry',   color: '#fbbf24' },
  { href: '/workouts',  icon: Dumbbell,        label: 'Workouts', color: '#60a5fa' },
]

const MORE_HREFS = ['/nutrition', '/journal', '/school', '/religious', '/settings']

export function MobileTabBar() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const isMoreActive = MORE_HREFS.some(h => pathname === h || pathname.startsWith(h + '/'))

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 pb-safe bg-white/92 dark:bg-[#020617]/90 backdrop-blur-2xl border-t border-stone-200/70 dark:border-white/[0.08] rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-around h-16 px-1">
          {PRIMARY_TABS.map(({ href, icon: Icon, label, color }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-0.5 flex-1 py-2"
              >
                <div
                  className="w-10 h-8 flex items-center justify-center rounded-xl transition-all"
                  style={active ? { backgroundColor: `${color}18` } : {}}
                >
                  <Icon
                    className="w-5 h-5 text-stone-400 dark:text-stone-500 transition-colors"
                    style={active ? { color } : undefined}
                  />
                </div>
                <span
                  className="text-[10px] font-medium text-stone-400 dark:text-stone-500 transition-colors"
                  style={active ? { color } : undefined}
                >
                  {label}
                </span>
              </Link>
            )
          })}

          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center gap-0.5 flex-1 py-2"
          >
            <div
              className="w-10 h-8 flex items-center justify-center rounded-xl transition-all"
              style={isMoreActive ? { backgroundColor: 'rgba(255,255,255,0.08)' } : {}}
            >
              <MoreHorizontal
                className="w-5 h-5 text-stone-400 dark:text-stone-500"
                style={isMoreActive ? { color: '#e5e7eb' } : undefined}
              />
            </div>
            <span
              className="text-[10px] font-medium text-stone-400 dark:text-stone-500"
              style={isMoreActive ? { color: '#e5e7eb' } : undefined}
            >
              More
            </span>
          </button>
        </div>
      </nav>
      <MobileMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  )
}
