'use client'
import Link from 'next/link'
import { Apple, BookOpen, GraduationCap, BookHeart, Settings, LogOut, X } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'

const MORE_ITEMS = [
  { href: '/nutrition', icon: Apple, label: 'Nutrition' },
  { href: '/journal', icon: BookOpen, label: 'Journal' },
  { href: '/school', icon: GraduationCap, label: 'School' },
  { href: '/religious', icon: BookHeart, label: 'Faith' },
  { href: '/settings/integrations', icon: Settings, label: 'Integrations' },
]

export function MobileMoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signOut } = useAuth()

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 lg:hidden" onClick={onClose} />
      <div className="fixed bottom-0 inset-x-0 bg-white dark:bg-stone-900 rounded-t-2xl z-50 pb-safe lg:hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
          <span className="font-semibold text-stone-900 dark:text-stone-50">More</span>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>
        <div className="px-4 py-3 space-y-1">
          {MORE_ITEMS.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </Link>
          ))}
          <button
            onClick={async () => { await signOut(); onClose() }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign out</span>
          </button>
        </div>
      </div>
    </>
  )
}
