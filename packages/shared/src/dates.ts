export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function startOfMonthISO(date = new Date()): string {
  return toISODate(new Date(date.getFullYear(), date.getMonth(), 1))
}

export function endOfMonthISO(date = new Date()): string {
  return toISODate(new Date(date.getFullYear(), date.getMonth() + 1, 0))
}

export function startOfWeekISO(date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  return toISODate(d)
}

export function endOfWeekISO(date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (6 - day))
  return toISODate(d)
}

export function formatDateDisplay(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function relativeDays(iso: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(iso + 'T00:00:00')
  target.setHours(0, 0, 0, 0)
  const diff = Math.floor((target.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff > 0) return `In ${diff} days`
  return `${Math.abs(diff)} days ago`
}
