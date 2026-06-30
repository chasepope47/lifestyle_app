interface PageHeroProps {
  title: string
  subtitle: string
  gradient: string
  accentHex: string
  action?: React.ReactNode
}

export function PageHero({ title, subtitle, gradient, accentHex, action }: PageHeroProps) {
  return (
    <div className="relative overflow-hidden" style={{ background: gradient }}>
      {/* Ambient glow orb */}
      <div
        className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none opacity-20"
        style={{ background: `radial-gradient(circle, ${accentHex}, transparent 70%)` }}
      />
      <div className="relative px-5 pt-8 pb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: `color-mix(in srgb, ${accentHex} 70%, transparent)` }}
          >
            {subtitle}
          </p>
        </div>
        {action && <div className="flex-shrink-0 mb-0.5">{action}</div>}
      </div>
    </div>
  )
}
