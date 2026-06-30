interface PageHeroProps {
  title: string
  subtitle: string
  gradient: string
  accentHex: string
  action?: React.ReactNode
  /** When true the hero has no solid background — the page's photo shows through */
  overlay?: boolean
}

export function PageHero({ title, subtitle, gradient, accentHex, action, overlay }: PageHeroProps) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: overlay
          ? 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.1) 70%, transparent 100%)'
          : gradient,
      }}
    >
      {/* Ambient glow orb — only shown in solid-gradient mode */}
      {!overlay && (
        <div
          className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none opacity-20"
          style={{ background: `radial-gradient(circle, ${accentHex}, transparent 70%)` }}
        />
      )}
      <div className="relative px-5 pt-8 pb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ textShadow: overlay ? '0 1px 8px rgba(0,0,0,0.6)' : undefined }}>{title}</h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: overlay ? 'rgba(255,255,255,0.65)' : `color-mix(in srgb, ${accentHex} 70%, transparent)` }}
          >
            {subtitle}
          </p>
        </div>
        {action && <div className="flex-shrink-0 mb-0.5">{action}</div>}
      </div>
    </div>
  )
}
