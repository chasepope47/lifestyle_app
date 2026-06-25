'use client'
import Link from 'next/link'
import { Wallet, ShoppingBasket, Apple, Dumbbell, BookOpen, GraduationCap, BookHeart, Heart } from 'lucide-react'
import { useHousehold } from '@/providers/HouseholdProvider'
import { useAuth } from '@/providers/AuthProvider'

const MODULE_CARDS = [
  { href: '/budget', icon: Wallet, label: 'Budget', description: 'Track income & expenses', color: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400' },
  { href: '/pantry', icon: ShoppingBasket, label: 'Pantry', description: 'Kitchen inventory & meals', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
  { href: '/nutrition', icon: Apple, label: 'Nutrition', description: 'Log food & track macros', color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
  { href: '/workouts', icon: Dumbbell, label: 'Workouts', description: 'Log sessions & sync wearables', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
  { href: '/journal', icon: BookOpen, label: 'Journal', description: 'Personal & shared entries', color: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400' },
  { href: '/school', icon: GraduationCap, label: 'School', description: 'Assignments & grades', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' },
  { href: '/religious', icon: BookHeart, label: 'Faith', description: 'Devotionals, prayer & scripture', color: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400' },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const { household, partner } = useHousehold()

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const displayName = user?.user_metadata?.display_name ?? 'there'

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
            {greeting()}, {displayName} 👋
          </h1>
        </div>
        {partner && (
          <p className="text-stone-500 dark:text-stone-400 text-sm flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            Sharing with {partner.display_name ?? 'your partner'} in {household?.name}
          </p>
        )}
      </div>

      {/* Invite partner CTA */}
      {!partner && household && (
        <div className="mb-8 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-5">
          <div className="flex items-start gap-3">
            <Heart className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-rose-800 dark:text-rose-200 mb-1">Invite your partner</p>
              <p className="text-sm text-rose-600 dark:text-rose-300 mb-3">
                Share your invite code so they can join your household.
              </p>
              <Link href="/household/settings" className="inline-flex items-center px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition-colors">
                Get invite code
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Module grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULE_CARDS.map(({ href, icon: Icon, label, description, color }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-sm transition-all"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-50 mb-0.5 group-hover:text-rose-500 transition-colors">{label}</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
