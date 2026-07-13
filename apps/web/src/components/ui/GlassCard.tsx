import { cn } from '@/lib/utils'

export function GlassCard({
  className,
  interactive = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        'glass-card rounded-2xl',
        interactive && 'transition-all duration-200 hover:border-white/20 hover:-translate-y-0.5',
        className,
      )}
      {...props}
    />
  )
}
