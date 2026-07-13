import { cn } from '@/lib/utils'

export function Badge({
  className,
  color,
  children,
}: {
  className?: string
  color?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded-lg font-mono border',
        className,
      )}
      style={{
        color: color ?? 'var(--accent2)',
        borderColor: `color-mix(in srgb, ${color ?? 'var(--accent2)'} 30%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${color ?? 'var(--accent2)'} 15%, transparent)`,
      }}
    >
      {children}
    </span>
  )
}
