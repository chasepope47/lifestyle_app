'use client'
import { Landmark, ShoppingBasket, Leaf, Mountain, BookOpen, GraduationCap, Sun, LayoutDashboard } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type ModuleKey = 'dashboard' | 'budget' | 'pantry' | 'nutrition' | 'workouts' | 'journal' | 'school' | 'religious'

const MODULES: Record<ModuleKey, { accentRgb: string; Icon: LucideIcon; bgImage: string }> = {
  dashboard: { accentRgb: '139,92,246',  Icon: LayoutDashboard, bgImage: '/images/modules/dashboard.jpg' },
  budget:    { accentRgb: '124,58,237',  Icon: Landmark,        bgImage: '/images/modules/budget.jpg'    },
  pantry:    { accentRgb: '251,191,36',  Icon: ShoppingBasket,  bgImage: '/images/modules/pantry.jpg'    },
  nutrition: { accentRgb: '52,211,153',  Icon: Leaf,            bgImage: '/images/modules/nutrition.jpg' },
  workouts:  { accentRgb: '96,165,250',  Icon: Mountain,        bgImage: '/images/modules/workouts.jpg'  },
  journal:   { accentRgb: '244,114,182', Icon: BookOpen,        bgImage: '/images/modules/journal.jpg'   },
  school:    { accentRgb: '251,146,60',  Icon: GraduationCap,   bgImage: '/images/modules/school.jpg'    },
  religious: { accentRgb: '45,212,191',  Icon: Sun,             bgImage: '/images/modules/religious.jpg' },
}

export function ModulePage({ module, children }: { module: ModuleKey; children: React.ReactNode }) {
  const { accentRgb, Icon, bgImage } = MODULES[module]
  return (
    <div className="pb-20 lg:pb-10 min-h-screen relative overflow-hidden" style={{ background: '#0d0c11' }}>
      {/* Full-bleed background photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bgImage}
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        style={{ opacity: 0.9 }}
        loading="eager"
      />
      {/* Dark overlay — ensures readability over any photo */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(0,0,0,0.55)' }} />
      {/* Thematic watermark icon at bottom-right */}
      <div
        className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/4 pointer-events-none select-none"
        aria-hidden
        style={{ zIndex: 5 }}
      >
        <Icon
          style={{ width: 280, height: 280, color: `rgb(${accentRgb})`, opacity: 0.12, strokeWidth: 0.7 }}
        />
      </div>
      {/* Page content sits above image and overlay */}
      <div className="relative" style={{ zIndex: 10 }}>
        {children}
      </div>
    </div>
  )
}
