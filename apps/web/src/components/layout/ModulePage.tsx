'use client'
import { Landmark, ShoppingBasket, Leaf, Mountain, BookOpen, GraduationCap, Sun } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type ModuleKey = 'budget' | 'pantry' | 'nutrition' | 'workouts' | 'journal' | 'school' | 'religious'

const MODULES: Record<ModuleKey, { topColor: string; accentRgb: string; Icon: LucideIcon }> = {
  budget:    { topColor: '#0f0823', accentRgb: '124,58,237',  Icon: Landmark       },
  pantry:    { topColor: '#1a1100', accentRgb: '251,191,36',  Icon: ShoppingBasket },
  nutrition: { topColor: '#011a0a', accentRgb: '52,211,153',  Icon: Leaf           },
  workouts:  { topColor: '#010f1d', accentRgb: '96,165,250',  Icon: Mountain       },
  journal:   { topColor: '#1a0014', accentRgb: '244,114,182', Icon: BookOpen       },
  school:    { topColor: '#1a0900', accentRgb: '251,146,60',  Icon: GraduationCap  },
  religious: { topColor: '#001818', accentRgb: '45,212,191',  Icon: Sun            },
}

export function ModulePage({ module, children }: { module: ModuleKey; children: React.ReactNode }) {
  const { topColor, accentRgb, Icon } = MODULES[module]
  return (
    <div
      className="pb-20 lg:pb-10 min-h-screen relative overflow-hidden"
      style={{
        background: [
          'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          `radial-gradient(ellipse 90% 40% at 50% -5%, rgba(${accentRgb},0.10), transparent)`,
          `linear-gradient(180deg, ${topColor} 0%, #0d0c11 50%)`,
          '#0d0c11',
        ].join(', '),
        backgroundSize: '32px 32px, 100% 100%, 100% auto, auto',
      }}
    >
      {/* Thematic watermark icon */}
      <div
        className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/4 pointer-events-none select-none"
        aria-hidden
      >
        <Icon
          style={{
            width: 340,
            height: 340,
            color: `rgb(${accentRgb})`,
            opacity: 0.07,
            strokeWidth: 0.6,
          }}
        />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  )
}
