import Link from 'next/link'
import { Heart, Wallet, ShoppingBasket, Apple, Dumbbell, BookOpen, GraduationCap, BookHeart } from 'lucide-react'

export default function LandingPage() {
  const features = [
    { icon: Wallet, label: 'Budget', description: 'Track income, expenses, and shared accounts together.' },
    { icon: ShoppingBasket, label: 'Pantry', description: 'Manage your kitchen inventory with expiration alerts.' },
    { icon: Apple, label: 'Nutrition', description: 'Log meals and track macros with the USDA food database.' },
    { icon: Dumbbell, label: 'Workouts', description: 'Log sessions and sync with Garmin or Bevel Health.' },
    { icon: BookOpen, label: 'Journal', description: 'Personal entries with an optional share-with-partner toggle.' },
    { icon: GraduationCap, label: 'School', description: 'Track assignments, grades, and sync with Canvas LMS.' },
    { icon: BookHeart, label: 'Faith', description: 'Devotionals, prayer requests, and scripture study notes.' },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 dark:bg-rose-900/30 px-4 py-1.5 text-sm text-rose-700 dark:text-rose-300 mb-8">
          <Heart className="w-4 h-4" />
          Built for couples
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-stone-900 dark:text-stone-50 mb-6">
          One app for your whole life
          <span className="text-rose-500"> together</span>
        </h1>
        <p className="text-xl text-stone-600 dark:text-stone-400 max-w-2xl mx-auto mb-10">
          Budget, pantry, nutrition, workouts, journal, school, and faith — all in one shared space.
          Invite your partner and build your lifestyle together.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-colors"
          >
            Get started free
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center px-8 py-3 rounded-full border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, label, description }) => (
            <div key={label} className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-rose-500" />
              </div>
              <h3 className="font-semibold text-stone-900 dark:text-stone-50 mb-1">{label}</h3>
              <p className="text-sm text-stone-600 dark:text-stone-400">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
