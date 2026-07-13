import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/providers/AuthProvider'
import { HouseholdProvider } from '@/providers/HouseholdProvider'
import { ModalProvider } from '@/providers/ModalProvider'
import { ThemeProvider } from '@/providers/ThemeProvider'

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-jetbrains-mono' })

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
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable} h-full`}>
      <body className="font-sans antialiased min-h-full bg-stone-50 text-stone-900 dark:bg-[#020617] dark:text-stone-50">
        <ThemeProvider>
          <AuthProvider>
            <HouseholdProvider>
              <ModalProvider>
                {children}
              </ModalProvider>
            </HouseholdProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
