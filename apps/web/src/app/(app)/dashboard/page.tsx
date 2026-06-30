'use client'
import Link from 'next/link'
import {
  Wallet, ShoppingBasket, Apple, Dumbbell,
  BookOpen, GraduationCap, BookHeart, Heart, ArrowRight,
} from 'lucide-react'
import { useHousehold } from '@/providers/HouseholdProvider'
import { useAuth } from '@/providers/AuthProvider'

const MODULES = [
  { href: '/budget',    icon: Wallet,        label: 'Budget',    desc: 'Track income & expenses',     hex: '#a78bfa', glow: 'rgba(167,139,250,0.15)' },
  { href: '/pantry',    icon: ShoppingBasket,label: 'Pantry',    desc: 'Kitchen inventory & meals',   hex: '#fbbf24', glow: 'rgba(251,191,36,0.15)'  },
  { href: '/nutrition', icon: Apple,         label: 'Nutrition', desc: 'Log food & track macros',     hex: '#34d399', glow: 'rgba(52,211,153,0.15)'  },
  { href: '/workouts',  icon: Dumbbell,      label: 'Workouts',  desc: 'Sessions & wearables',        hex: '#60a5fa', glow: 'rgba(96,165,250,0.15)'  },
  { href: '/journal',   icon: BookOpen,      label: 'Journal',   desc: 'Personal & shared entries',   hex: '#f472b6', glow: 'rgba(244,114,182,0.15)' },
  { href: '/school',    icon: GraduationCap, label: 'School',    desc: 'Assignments & grades',        hex: '#fb923c', glow: 'rgba(251,146,60,0.15)'  },
  { href: '/religious', icon: BookHeart,     label: 'Faith',     desc: 'Devotionals, prayer & more',  hex: '#2dd4bf', glow: 'rgba(45,212,191,0.15)'  },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { household, partner } = useHousehold()
  const displayName = user?.user_metadata?.display_name ?? 'there'

  return (
    <div className="pb-20 lg:pb-10">
      {/* Hero banner */}
      <div
        className="px-5 pt-10 pb-8 mb-6 relative overflow-hidden"
        style={{ background: 'var(--hero-gradient)' }}
      >
        {/* Ambient glow orbs */}
        <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, var(--accent), transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle, var(--accent2), transparent 70%)' }} />

        <div className="relative">
          <p className="text-sm font-medium mb-1" style={{ color: 'color-mix(in srgb, var(--accent) 70%, transparent)' }}>
            {greeting()}
          </p>
          <h1 className="text-2xl font-bold text-white mb-3">
            Welcome back, {displayName}
          </h1>

          {partner ? (
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
              style={{ background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.2)' }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #ec4899, #f97316)' }}
              >
                {(partner.display_name ?? '?')[0].toUpperCase()}
              </div>
              <Heart className="w-3 h-3 text-rose-400" />
              <span style={{ color: 'rgba(236,72,153,0.85)' }}>
                {partner.display_name ?? 'Partner'} · {household?.name}
              </span>
            </div>
          ) : (
            <div className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {household?.name ?? 'Your household'}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 max-w-4xl mx-auto">
        {/* Invite partner CTA */}
        {!partner && household && (
          <div
            className="mb-6 rounded-2xl p-4 flex items-center gap-4"
            style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.18)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.25), rgba(249,115,22,0.15))' }}
            >
              <Heart className="w-5 h-5 text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-rose-300 text-sm mb-0.5">Invite your partner</p>
              <p className="text-xs" style={{ color: 'rgba(236,72,153,0.55)' }}>
                Share your invite code so they can join your household.
              </p>
            </div>
            <Link
              href="/household/settings"
              className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #ec4899, #f97316)' }}
            >
              Invite <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Module grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MODULES.map(({ href, icon: Icon, label, desc, hex, glow }) => (
            <Link
              key={href}
              href={href}
              className="group relative rounded-2xl p-5 transition-all duration-200 overflow-hidden bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 hover:shadow-lg hover:-translate-y-0.5"
            >
              {/* Top accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${hex}60, transparent)` }}
              />

              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 0% 0%, ${glow}, transparent 60%)` }}
              />

              <div className="relative">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 shadow-sm"
                  style={{ backgroundColor: `${hex}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: hex }} />
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <h3 className="font-semibold text-stone-900 dark:text-stone-50 mb-0.5">{label}</h3>
                    <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed">{desc}</p>
                  </div>
                  <ArrowRight
                    className="w-4 h-4 flex-shrink-0 ml-2 mb-0.5 opacity-0 group-hover:opacity-60 transition-opacity"
                    style={{ color: hex }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
