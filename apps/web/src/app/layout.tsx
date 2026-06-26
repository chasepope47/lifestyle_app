import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/providers/AuthProvider'
import { HouseholdProvider } from '@/providers/HouseholdProvider'
import { ModalProvider } from '@/providers/ModalProvider'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'Together — Your Lifestyle App',
  description: 'Budget, pantry, nutrition, workouts, journal, school, and faith — built for couples.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} h-full`}>
      <body className="font-sans antialiased min-h-full bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-50">
        <AuthProvider>
          <HouseholdProvider>
            <ModalProvider>
              {children}
            </ModalProvider>
          </HouseholdProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
