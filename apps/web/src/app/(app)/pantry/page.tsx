'use client'
import { useEffect, useState } from 'react'
import { Plus, Search, Trash2, AlertCircle, ArrowLeft, Barcode } from 'lucide-react'
import { useHousehold } from '@/providers/HouseholdProvider'
import { createClient } from '@/lib/supabase/client'
import { getExpirationStatus, expirationBadgeClasses, formatExpirationLabel } from '@lifestyle/shared'
import type { Database } from '@lifestyle/db'

type PantryItem = Database['public']['Tables']['pantry_items']['Row']

const CATEGORIES = ['Produce', 'Dairy', 'Meat & Seafood', 'Frozen', 'Pantry', 'Snacks', 'Beverages', 'Other']
const STORES = ['Costco', 'Walmart', 'Amazon', "Sam's Club", 'Target', 'Whole Foods', 'No store']
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
  const [activeTab, setActiveTab] = useState<'pantry' | 'shopping'>('pantry')
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', category: '', quantity: '1', unit: '', price: '', expiration_date: '', store: 'No store' })

  const load = async () => {
    if (!householdId) return
    const { data } = await supabase.from('pantry_items').select('*').eq('household_id', householdId).order('name')
    setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [householdId])

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!householdId || !form.name) return
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
    setForm({ name: '', category: '', quantity: '1', unit: '', price: '', expiration_date: '', store: 'No store' })
  }

  const deleteItem = async (id: string) => {
    await supabase.from('pantry_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const filtered = items.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || i.category === selectedCategory
    const isActive = activeTab === 'pantry' ? !['expired', 'critical'].includes(getExpirationStatus(i.expiration_date)) : ['expired', 'critical', 'soon'].includes(getExpirationStatus(i.expiration_date))
    return matchesSearch && matchesCategory && isActive
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

  const groupedByStore = STORES.reduce((acc, store) => {
    const storeItems = filtered.filter(i => i.store === store)
    if (storeItems.length > 0) {
      acc[store] = storeItems
    }
    return acc
  }, {} as Record<string, PantryItem[]>)

  if (loading) return <div className="p-8 text-stone-400">Loading…</div>

  return (
    <div className="px-4 py-8 max-w-5xl mx-auto pb-20">
      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-stone-700">
        <button
          onClick={() => setActiveTab('pantry')}
          className={`pb-3 px-2 font-medium transition-colors ${
            activeTab === 'pantry'
              ? 'text-stone-50 border-b-2 border-yellow-500'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          Pantry
        </button>
        <button
          onClick={() => setActiveTab('shopping')}
          className={`pb-3 px-2 font-medium transition-colors relative ${
            activeTab === 'shopping'
              ? 'text-stone-50 border-b-2 border-yellow-500'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          Shopping
          {expiringSoon.length > 0 && (
            <span className="absolute -top-1 -right-2 w-5 h-5 bg-red-500 rounded-full text-xs font-bold text-white flex items-center justify-center">
              {expiringSoon.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'pantry' ? (
        <>
          {/* Search */}
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
        </>
      ) : (
        <>
          {/* Shopping tab */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-stone-50 mb-4">Items to Buy or Remove</h2>
            {filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed border-stone-700 p-8 text-center text-stone-400">
                No expired or soon-to-expire items
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedByStore).map(([store, storeItems]) => (
                  <div key={store}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-stone-300">🏪 {store.toUpperCase()}</span>
                      <span className="text-xs text-stone-400 ml-auto">{storeItems.length} items</span>
                    </div>
                    <div className="space-y-2">
                      {storeItems.map(item => {
                        const status = getExpirationStatus(item.expiration_date)
                        return (
                          <div key={item.id} className="flex items-center justify-between rounded-lg bg-stone-800/50 border border-stone-700 px-4 py-3 group hover:bg-stone-800 transition-colors">
                            <div className="flex-1">
                              <p className="font-medium text-stone-50">{item.name}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-stone-400">
                                {item.category && <span>{item.category}</span>}
                                {item.quantity && <span>•</span>}
                                {item.quantity && <span>Qty: {item.quantity}{item.unit ? ' ' + item.unit : ''}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
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
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Add button */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 right-4 rounded-full bg-yellow-500 hover:bg-yellow-600 text-stone-900 p-4 shadow-lg transition-colors"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add Item Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-stone-900 w-full sm:max-w-md sm:rounded-2xl max-h-screen overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-stone-900 border-b border-stone-700 px-6 py-4 flex items-center gap-3">
              <button onClick={() => setShowAdd(false)} className="p-1 hover:bg-stone-800 rounded">
                <ArrowLeft className="w-5 h-5 text-stone-50" />
              </button>
              <h1 className="text-lg font-semibold text-stone-50">Add Item</h1>
            </div>

            {/* Barcode scanner */}
            <div className="px-6 pt-4">
              <button className="w-full py-3 rounded-lg border-2 border-dashed border-yellow-500 text-yellow-500 font-medium hover:bg-yellow-500/10 transition-colors flex items-center justify-center gap-2">
                <Barcode className="w-5 h-5" />
                Scan Barcode
              </button>
            </div>

            {/* Form */}
            <form onSubmit={addItem} className="flex-1 px-6 py-4 space-y-4">
              {/* Product Name */}
              <div>
                <label className="text-sm font-medium text-stone-300 mb-2 block">Product Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Organic Pasta"
                  required
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-3 text-stone-50 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-sm font-medium text-stone-300 mb-2 block">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-3 text-stone-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>
                  ))}
                </select>
              </div>

              {/* Store */}
              <div>
                <label className="text-sm font-medium text-stone-300 mb-2 block">Store</label>
                <select
                  value={form.store}
                  onChange={e => setForm(p => ({ ...p, store: e.target.value }))}
                  className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-3 text-stone-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  {STORES.map(store => (
                    <option key={store} value={store}>{store}</option>
                  ))}
                </select>
                <p className="text-xs text-stone-400 mt-1"><a href="#" className="text-yellow-500 hover:underline">Edit stores...</a></p>
              </div>

              {/* Expiration Date */}
              <div>
                <label className="text-sm font-medium text-stone-300 mb-2 block">Expiration Date (optional)</label>
                <input
                  type="date"
                  value={form.expiration_date}
                  onChange={e => setForm(p => ({ ...p, expiration_date: e.target.value }))}
                  className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-3 text-stone-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="text-sm font-medium text-stone-300 mb-2 block">Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, quantity: String(Math.max(1, parseFloat(p.quantity) - 1)) }))}
                    className="w-10 h-10 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-50 font-semibold transition-colors"
                  >
                    −
                  </button>
                  <input
                    type="text"
                    value={form.quantity}
                    onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                    className="flex-1 rounded-lg border border-stone-600 bg-stone-800 px-4 py-2 text-center text-stone-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, quantity: String(parseFloat(p.quantity) + 1) }))}
                    className="w-10 h-10 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-stone-900 font-semibold transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="text-sm font-medium text-stone-300 mb-2 block">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.price}
                  onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                  className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-3 text-stone-50 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              {/* Submit button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-stone-900 font-semibold transition-colors"
                >
                  Add to Pantry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
