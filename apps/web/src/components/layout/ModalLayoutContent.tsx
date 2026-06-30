'use client'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileTabBar } from '@/components/layout/MobileTabBar'

export function ModalLayoutContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const isModal = searchParams.get('modal') === 'true'

  const handleClose = () => {
    // Go back to the previous page in history rather than pushing the same
    // pathname (which would keep the user on the current page without modal)
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/dashboard')
    }
  }

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-50 animate-in fade-in duration-200"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      >
        <div
          className="h-screen flex flex-col animate-in slide-in-from-right duration-250"
          style={{
            background: [
              'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
              '#0d0c11',
            ].join(', '),
            backgroundSize: '32px 32px, auto',
          }}
        >
          {/* Modal header */}
          <div
            className="flex items-center justify-between px-5 py-4 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
          >
            <span className="text-base font-semibold text-white/80 capitalize">
              {pathname.replace('/', '') || 'Page'}
            </span>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)' }}
              aria-label="Close"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
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
