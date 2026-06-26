import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/providers/AuthProvider'
import { HouseholdProvider } from '@/providers/HouseholdProvider'
import { ModalProvider } from '@/providers/ModalProvider'

export const viewport: Viewport = {
  themeColor: '#1c1917',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'Together — Your Lifestyle App',
  description: 'Budget, pantry, nutrition, workouts, journal, school, and faith — built for couples.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Together',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
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
