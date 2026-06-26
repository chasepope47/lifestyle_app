'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Wallet, ShoppingBasket, Apple, Dumbbell,
  BookOpen, GraduationCap, BookHeart, Heart, LogOut, Settings,
} from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useHousehold } from '@/providers/HouseholdProvider'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/budget', icon: Wallet, label: 'Budget' },
  { href: '/pantry', icon: ShoppingBasket, label: 'Pantry' },
  { href: '/nutrition', icon: Apple, label: 'Nutrition' },
  { href: '/workouts', icon: Dumbbell, label: 'Workouts' },
  { href: '/journal', icon: BookOpen, label: 'Journal' },
  { href: '/school', icon: GraduationCap, label: 'School' },
  { href: '/religious', icon: BookHeart, label: 'Faith' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const { household, partner } = useHousehold()

  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 sticky top-0 h-screen">
      {/* Brand */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-stone-200 dark:border-stone-800">
        <Heart className="w-5 h-5 text-rose-500 shrink-0" />
        <span className="font-bold text-stone-900 dark:text-stone-50 truncate">
          {household?.name ?? 'Together'}
        </span>
      </div>

      {/* Partner badge */}
      {partner && (
        <div className="mx-4 mt-4 flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-rose-200 dark:bg-rose-800 flex items-center justify-center text-xs font-bold text-rose-700 dark:text-rose-200">
            {(partner.display_name ?? '?')[0].toUpperCase()}
          </div>
          <span className="text-sm text-rose-700 dark:text-rose-300 truncate">{partner.display_name ?? 'Partner'}</span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={`${href}?modal=true`}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                active
                  ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-50'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-stone-200 dark:border-stone-800 space-y-0.5">
        <Link
          href="/settings/integrations"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          <Settings className="w-4 h-4 shrink-0" />
          Integrations
        </Link>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
