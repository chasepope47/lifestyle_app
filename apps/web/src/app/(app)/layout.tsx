import { Sidebar } from '@/components/layout/Sidebar'
import { MobileTabBar } from '@/components/layout/MobileTabBar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
