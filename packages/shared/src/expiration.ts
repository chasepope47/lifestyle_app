// Ported and extended from popepantry

export type ExpirationStatus = 'expired' | 'critical' | 'soon' | 'ok' | 'none'

export function getExpirationStatus(expirationDate: string | null | undefined): ExpirationStatus {
  if (!expirationDate) return 'none'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exp = new Date(expirationDate)
  exp.setHours(0, 0, 0, 0)

  const daysUntil = Math.floor((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntil < 0) return 'expired'
  if (daysUntil === 0) return 'critical'
  if (daysUntil <= 3) return 'critical'
  if (daysUntil <= 7) return 'soon'
  return 'ok'
}

export function formatExpirationLabel(expirationDate: string | null | undefined): string {
  if (!expirationDate) return ''

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exp = new Date(expirationDate)
  exp.setHours(0, 0, 0, 0)

  const daysUntil = Math.floor((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntil < 0) return `Expired ${Math.abs(daysUntil)}d ago`
  if (daysUntil === 0) return 'Expires today'
  if (daysUntil === 1) return 'Expires tomorrow'
  if (daysUntil <= 7) return `Expires in ${daysUntil}d`
  return `Exp ${exp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

export const expirationBadgeClasses: Record<ExpirationStatus, string> = {
  expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  critical: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  soon: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  ok: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  none: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
}
