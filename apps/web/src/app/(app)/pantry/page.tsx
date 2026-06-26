'use client'
import { useEffect, useState } from 'react'
import { Plus, Search, Trash2, AlertCircle } from 'lucide-react'
import { useHousehold } from '@/providers/HouseholdProvider'
import { createClient } from '@/lib/supabase/client'
import { getExpirationStatus, expirationBadgeClasses, formatExpirationLabel } from '@lifestyle/shared'
import type { Database } from '@lifestyle/db'

type PantryItem = Database['public']['Tables']['pantry_items']['Row']

const CATEGORIES = ['Produce', 'Dairy', 'Meat & Seafood', 'Frozen', 'Pantry', 'Snacks', 'Beverages', 'Other']
const CATEGORY_ICONS: Record<string, string> = {
  'Produce': '🥬',
  'Dairy': '🥛',
  'Meat & Seafood': '🥩',
  'Frozen': '❄️',
  'Pantry': '🥫',
  'Snacks': '🍿',
  'Beverages': '🥤',
  'Other': '📦',
}

export default function PantryPage() {
  const { householdId } = useHousehold()
  const supabase = createClient()
  const [items, setItems] = useState<PantryItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
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

  const deleteItem = async (id: string) => {
    await supabase.from('pantry_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const filtered = items.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || i.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const expiringSoon = items.filter(i => ['expired', 'critical', 'soon'].includes(getExpirationStatus(i.expiration_date)))

  const totalItems = filtered.length
  const totalUnits = filtered.reduce((sum, i) => sum + (i.quantity || 0), 0)
  const totalValue = filtered.reduce((sum, i) => sum + (i.price || 0), 0)

  const groupedByCategory = CATEGORIES.reduce((acc, cat) => {
    const catItems = filtered.filter(i => i.category === cat)
    if (catItems.length > 0) {
      acc[cat] = catItems
    }
    return acc
  }, {} as Record<string, PantryItem[]>)

  if (loading) return <div className="p-8 text-stone-400">Loading…</div>

  return (
    <div className="px-4 py-8 max-w-5xl mx-auto pb-20">
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search pantry…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['All', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-yellow-500 text-stone-900'
                : 'bg-stone-800 dark:bg-stone-800 text-stone-300 hover:text-stone-50'
            }`}
          >
            {cat === 'All' ? 'All' : `${CATEGORY_ICONS[cat] || '📦'} ${cat}`}
          </button>
        ))}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg bg-stone-800 dark:bg-stone-800 border border-stone-700 p-4">
          <p className="text-xs text-stone-400 mb-1">Items</p>
          <p className="text-2xl font-bold text-stone-50">{totalItems}</p>
        </div>
        <div className="rounded-lg bg-stone-800 dark:bg-stone-800 border border-stone-700 p-4">
          <p className="text-xs text-stone-400 mb-1">Units</p>
          <p className="text-2xl font-bold text-stone-50">{Math.round(totalUnits)}</p>
        </div>
        <div className="rounded-lg bg-stone-800 dark:bg-stone-800 border border-stone-700 p-4">
          <p className="text-xs text-stone-400 mb-1">Value</p>
          <p className="text-2xl font-bold text-stone-50">${totalValue.toFixed(2)}</p>
        </div>
      </div>

      {/* Expiring alert */}
      {expiringSoon.length > 0 && (
        <div className="mb-6 rounded-lg bg-orange-900/30 border border-orange-700 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-200">
              {expiringSoon.length} item{expiringSoon.length > 1 ? 's' : ''} expiring or expired
            </p>
            <p className="text-xs text-orange-300 mt-1">Tap to view shopping suggestions →</p>
          </div>
        </div>
      )}

      {/* Items by category */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-700 p-8 text-center text-stone-400">
          {search ? 'No items match your search.' : 'Your pantry is empty. Add your first item!'}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByCategory).map(([category, catItems]) => {
            const catTotal = catItems.reduce((sum, i) => sum + (i.price || 0), 0)
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-stone-300">
                  <span>{CATEGORY_ICONS[category] || '📦'}</span>
                  <span className="text-stone-50">{category.toUpperCase()}</span>
                  <span className="ml-auto text-yellow-500">${catTotal.toFixed(2)}</span>
                </div>
                <div className="space-y-2">
                  {catItems.map(item => {
                    const status = getExpirationStatus(item.expiration_date)
                    return (
                      <div key={item.id} className="flex items-center justify-between rounded-lg bg-stone-800/50 border border-stone-700 px-4 py-3 group hover:bg-stone-800 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-stone-50">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-stone-400">
                            {item.quantity && <span>{item.quantity}{item.unit ? ' ' + item.unit : ''}</span>}
                            {item.store && <span>•</span>}
                            {item.store && <span>{item.store}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            {item.price && (
                              <>
                                <p className="font-semibold text-stone-50">${item.price.toFixed(2)}</p>
                                <p className="text-xs text-stone-400">Cost</p>
                              </>
                            )}
                          </div>
                          {item.expiration_date && (
                            <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${expirationBadgeClasses[status]}`}>
                              {formatExpirationLabel(item.expiration_date)}
                            </span>
                          )}
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="p-2 opacity-0 group-hover:opacity-100 hover:bg-stone-700 rounded transition-all"
                          >
                            <Trash2 className="w-4 h-4 text-stone-400" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add button */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 right-4 rounded-full bg-yellow-500 hover:bg-yellow-600 text-stone-900 p-4 shadow-lg transition-colors"
      >
        <Plus className="w-6 h-6" />
      </button>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-stone-900 rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-stone-50 mb-4">Add pantry item</h3>
            <form onSubmit={addItem} className="space-y-3">
              {[
                { key: 'name', placeholder: 'Item name *', required: true, type: 'text' },
                { key: 'category', placeholder: 'Category', required: false, type: 'select', options: CATEGORIES },
                { key: 'quantity', placeholder: 'Quantity', required: false, type: 'number' },
                { key: 'unit', placeholder: 'Unit (e.g. lbs, oz)', required: false, type: 'text' },
                { key: 'price', placeholder: 'Price', required: false, type: 'number' },
                { key: 'store', placeholder: 'Store', required: false, type: 'text' },
                { key: 'expiration_date', placeholder: 'Expiration date', required: false, type: 'date' },
              ].map(({ key, placeholder, required, type, options }) => (
                key === 'category' && options ? (
                  <select
                    key={key}
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-2.5 text-stone-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="">Select category</option>
                    {options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    key={key}
                    type={type}
                    placeholder={placeholder}
                    required={required}
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-2.5 text-stone-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                )
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-lg border border-stone-600 text-sm font-medium text-stone-300 hover:bg-stone-800">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-stone-900 text-sm font-semibold">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
