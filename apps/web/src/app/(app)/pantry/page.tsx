'use client'
import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { useHousehold } from '@/providers/HouseholdProvider'
import { createClient } from '@/lib/supabase/client'
import { getExpirationStatus, expirationBadgeClasses, formatExpirationLabel } from '@lifestyle/shared'
import type { Database } from '@lifestyle/db'

type PantryItem = Database['public']['Tables']['pantry_items']['Row']

export default function PantryPage() {
  const { householdId } = useHousehold()
  const supabase = createClient()
  const [items, setItems] = useState<PantryItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', category: '', quantity: '', unit: '', price: '', expiration_date: '', store: '' })

  const load = async () => {
    if (!householdId) return
    const { data } = await supabase.from('pantry_items').select('*').eq('household_id', householdId).order('name')
    setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [householdId])

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!householdId) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('pantry_items').insert({
      household_id: householdId,
      user_id: user.id,
      name: form.name,
      category: form.category || null,
      quantity: form.quantity ? parseFloat(form.quantity) : null,
      unit: form.unit || null,
      price: form.price ? parseFloat(form.price) : null,
      expiration_date: form.expiration_date || null,
      store: form.store || null,
    }).select().single()
    if (data) setItems(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    setShowAdd(false)
    setForm({ name: '', category: '', quantity: '', unit: '', price: '', expiration_date: '', store: '' })
  }

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
  const expiringSoon = items.filter(i => ['expired', 'critical', 'soon'].includes(getExpirationStatus(i.expiration_date)))

  if (loading) return <div className="p-8 text-stone-400">Loading…</div>

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Pantry</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition-colors">
          <Plus className="w-4 h-4" /> Add item
        </button>
      </div>

      {expiringSoon.length > 0 && (
        <div className="mb-6 rounded-2xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4">
          <p className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-2">
            {expiringSoon.length} item{expiringSoon.length > 1 ? 's' : ''} expiring soon
          </p>
          <div className="flex flex-wrap gap-2">
            {expiringSoon.map(i => (
              <span key={i.id} className={`text-xs px-2 py-1 rounded-full ${expirationBadgeClasses[getExpirationStatus(i.expiration_date)]}`}>
                {i.name} — {formatExpirationLabel(i.expiration_date)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search pantry…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 p-8 text-center text-stone-400">
          {search ? 'No items match your search.' : 'Your pantry is empty. Add your first item!'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => {
            const status = getExpirationStatus(item.expiration_date)
            return (
              <div key={item.id} className="flex items-center justify-between rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-4 py-3">
                <div>
                  <p className="font-medium text-stone-900 dark:text-stone-50">{item.name}</p>
                  <p className="text-xs text-stone-400">
                    {[item.quantity && `${item.quantity}${item.unit ? ' ' + item.unit : ''}`, item.category, item.store].filter(Boolean).join(' · ')}
                  </p>
                </div>
                {item.expiration_date && (
                  <span className={`text-xs px-2 py-1 rounded-full ${expirationBadgeClasses[status]}`}>
                    {formatExpirationLabel(item.expiration_date)}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-stone-900 dark:text-stone-50 mb-4">Add pantry item</h3>
            <form onSubmit={addItem} className="space-y-3">
              {[
                { key: 'name', placeholder: 'Item name *', required: true, type: 'text' },
                { key: 'category', placeholder: 'Category (e.g. Produce)', required: false, type: 'text' },
                { key: 'quantity', placeholder: 'Quantity', required: false, type: 'number' },
                { key: 'unit', placeholder: 'Unit (e.g. lbs, oz)', required: false, type: 'text' },
                { key: 'price', placeholder: 'Price', required: false, type: 'number' },
                { key: 'expiration_date', placeholder: '', required: false, type: 'date' },
                { key: 'store', placeholder: 'Store', required: false, type: 'text' },
              ].map(({ key, placeholder, required, type }) => (
                <input
                  key={key}
                  type={type}
                  placeholder={placeholder || (key === 'expiration_date' ? 'Expiration date' : '')}
                  required={required}
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              ))}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-sm font-medium text-stone-700 dark:text-stone-300">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
