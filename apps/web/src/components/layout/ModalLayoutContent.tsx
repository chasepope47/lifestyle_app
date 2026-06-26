'use client'
import { useSearchParams, usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import Link from 'next/link'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileTabBar } from '@/components/layout/MobileTabBar'

export function ModalLayoutContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const isModal = searchParams.get('modal') === 'true'

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-stone-900/50 dark:bg-stone-950/50 animate-in fade-in duration-300">
        <div className="h-screen flex flex-col bg-white dark:bg-stone-900 animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
            <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">Page</h1>
            <Link
              href={pathname}
              className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-stone-600 dark:text-stone-400" />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        {children}
      </main>
      <MobileTabBar />
    </div>
  )
}
