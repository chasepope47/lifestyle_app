'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Wallet, ShoppingBasket, Apple, Dumbbell,
  BookOpen, GraduationCap, BookHeart, Heart, LogOut, Settings,
} from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useHousehold } from '@/providers/HouseholdProvider'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: '#a78bfa' },
  { href: '/budget',    icon: Wallet,          label: 'Budget',    color: '#a78bfa' },
  { href: '/pantry',    icon: ShoppingBasket,  label: 'Pantry',    color: '#fbbf24' },
  { href: '/nutrition', icon: Apple,           label: 'Nutrition', color: '#34d399' },
  { href: '/workouts',  icon: Dumbbell,        label: 'Workouts',  color: '#60a5fa' },
  { href: '/journal',   icon: BookOpen,        label: 'Journal',   color: '#f472b6' },
  { href: '/school',    icon: GraduationCap,   label: 'School',    color: '#fb923c' },
  { href: '/religious', icon: BookHeart,       label: 'Faith',     color: '#2dd4bf' },
]

function NavItem({ href, icon: Icon, label, color, active }: (typeof NAV)[0] & { active: boolean }) {
  return (
    <Link
      href={`${href}?modal=true`}
      className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
      style={active
        ? { background: `${color}18`, color: color }
        : { color: 'rgba(255,255,255,0.4)' }
      }
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
        style={active
          ? { backgroundColor: `${color}20` }
          : { backgroundColor: 'rgba(255,255,255,0.05)' }
        }
      >
        <Icon
          className="w-3.5 h-3.5 transition-colors"
          style={active ? { color } : {}}
        />
      </div>
      <span className={`flex-1 transition-colors ${active ? '' : 'group-hover:text-white/80'}`}>{label}</span>
      {active && (
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      )}
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const { household, partner } = useHousehold()

  return (
    <aside
      className="hidden lg:flex flex-col w-64 min-h-screen sticky top-0 h-screen overflow-hidden"
      style={{ background: '#0d0c11', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Left gradient accent stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-px" style={{ background: 'linear-gradient(to bottom, transparent, rgba(124,58,237,0.4) 30%, rgba(236,72,153,0.3) 70%, transparent)' }} />

      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
        >
          <Heart className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-white truncate">{household?.name ?? 'Together'}</span>
      </div>

      {/* Partner badge */}
      {partner && (
        <div className="mx-4 mt-4 flex-shrink-0">
          <div
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
            style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.15)' }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #ec4899, #f97316)' }}
            >
              {(partner.display_name ?? '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-pink-300 truncate">{partner.display_name ?? 'Partner'}</p>
              <p className="text-xs" style={{ color: 'rgba(236,72,153,0.5)' }}>Connected</p>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(item => (
          <NavItem
            key={item.href}
            {...item}
            active={pathname === item.href || pathname.startsWith(item.href + '/')}
          />
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 flex-shrink-0 space-y-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link
          href="/settings/integrations"
          className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
            <Settings className="w-3.5 h-3.5" />
          </div>
          <span className="group-hover:text-white/70 transition-colors">Integrations</span>
        </Link>
        <button
          onClick={signOut}
          className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-red-500/8"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
            <LogOut className="w-3.5 h-3.5" />
          </div>
          <span className="group-hover:text-red-400 transition-colors">Sign out</span>
        </button>
      </div>
    </aside>
  )
}
