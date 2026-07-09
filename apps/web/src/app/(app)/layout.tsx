'use client'
import { Suspense } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileTabBar } from '@/components/layout/MobileTabBar'
import { ModalLayoutContent } from '@/components/layout/ModalLayoutContent'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 min-w-0 pb-20 lg:pb-0">
          {children}
        </main>
        <MobileTabBar />
      </div>
    }>
      <ModalLayoutContent>
        {children}
      </ModalLayoutContent>
    </Suspense>
  )
}
