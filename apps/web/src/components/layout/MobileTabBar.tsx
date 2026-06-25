'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Wallet, ShoppingBasket, Dumbbell, MoreHorizontal,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { MobileMoreSheet } from './MobileMoreSheet'

const PRIMARY_TABS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/budget', icon: Wallet, label: 'Budget' },
  { href: '/pantry', icon: ShoppingBasket, label: 'Pantry' },
  { href: '/workouts', icon: Dumbbell, label: 'Workouts' },
]

export function MobileTabBar() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 z-40 pb-safe">
        <div className="flex items-center justify-around h-16">
          {PRIMARY_TABS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium',
                  active ? 'text-rose-500' : 'text-stone-500 dark:text-stone-400'
                )}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            )
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium text-stone-500 dark:text-stone-400"
          >
            <MoreHorizontal className="w-5 h-5" />
            More
          </button>
        </div>
      </nav>
      <MobileMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  )
}
