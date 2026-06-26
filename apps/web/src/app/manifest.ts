import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Together — Lifestyle App',
    short_name: 'Together',
    description: 'Budget, nutrition, workouts, and more — built for couples.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#1c1917',
    theme_color: '#1c1917',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
