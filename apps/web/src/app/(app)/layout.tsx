'use client'
import { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileTabBar } from '@/components/layout/MobileTabBar'
import { ModalLayoutContent } from '@/components/layout/ModalLayoutContent'
import { useAuth } from '@/providers/AuthProvider'
import { useHousehold } from '@/providers/HouseholdProvider'

const loadingFallback = (
  <div className="flex min-h-screen">
    <Sidebar />
    <main className="flex-1 min-w-0 pb-20 lg:pb-0" />
    <MobileTabBar />
  </div>
)

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { householdId, loading: householdLoading } = useHousehold()

  useEffect(() => {
    if (authLoading || householdLoading) return
    if (user && !householdId) router.replace('/household/setup')
  }, [authLoading, householdLoading, user, householdId, router])

  if (!authLoading && user && !householdLoading && !householdId) {
    return loadingFallback
  }

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
