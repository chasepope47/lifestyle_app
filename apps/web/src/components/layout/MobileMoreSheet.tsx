'use client'
import Link from 'next/link'
import { Apple, BookOpen, GraduationCap, BookHeart, Settings, LogOut, X, Heart } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'

const MORE_ITEMS = [
  { href: '/nutrition', icon: Apple,        label: 'Nutrition', desc: 'Food & macros',           color: '#34d399' },
  { href: '/journal',   icon: BookOpen,     label: 'Journal',   desc: 'Entries & reflections',    color: '#f472b6' },
  { href: '/school',    icon: GraduationCap,label: 'School',    desc: 'Assignments & grades',     color: '#fb923c' },
  { href: '/religious', icon: BookHeart,    label: 'Faith',     desc: 'Devotionals & prayer',     color: '#2dd4bf' },
]

export function MobileMoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signOut } = useAuth()

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 lg:hidden"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 inset-x-0 z-50 lg:hidden rounded-t-3xl pb-safe overflow-hidden"
        style={{ background: '#0d0c11', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
            >
              <Heart className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-white">More</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <X className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.55)' }} />
          </button>
        </div>

        {/* 2-column module grid */}
        <div className="px-4 pb-2">
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            {MORE_ITEMS.map(({ href, icon: Icon, label, desc, color }) => (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="flex flex-col gap-2.5 px-4 py-3.5 rounded-2xl transition-opacity active:opacity-70"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-tight">{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{desc}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Integrations row */}
          <Link
            href="/settings/integrations"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-xl w-full mb-2 transition-opacity active:opacity-70"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(148,163,184,0.12)' }}>
              <Settings className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>Integrations</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.32)' }}>Connected services</p>
            </div>
          </Link>

          {/* Sign out */}
          <button
            onClick={async () => { await signOut(); onClose() }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-4 transition-opacity active:opacity-70"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.14)' }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.14)' }}>
              <LogOut className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-sm font-medium text-red-400">Sign out</span>
          </button>
        </div>
      </div>
    </>
  )
}
