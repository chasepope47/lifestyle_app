export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
}) {
  return (
    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0" aria-label={label}>
      <input
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="sr-only peer"
        type="checkbox"
      />
      <div
        className="w-11 h-6 rounded-full peer transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"
        style={{ backgroundColor: checked ? 'var(--accent)' : 'var(--surface-container-highest)' }}
      />
    </label>
  )
}
