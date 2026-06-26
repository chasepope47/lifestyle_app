'use client'
import { useEffect, useState, useRef } from 'react'
import { Plus, Search, Barcode, X } from 'lucide-react'
import { useHousehold } from '@/providers/HouseholdProvider'
import { useAuth } from '@/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { todayISO } from '@lifestyle/shared'
import { searchFoods, type FoodSearchResult } from '@lifestyle/integrations'
import type { Database } from '@lifestyle/db'

type FoodEntry = Database['public']['Tables']['food_entries']['Row']
type NutritionGoals = Database['public']['Tables']['nutrition_goals']['Row']

function MacroRing({ value, goal, label, color }: { value: number; goal: number; label: string; color: string }) {
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0
  const r = 28
  const circ = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-stone-200 dark:text-stone-700" />
          <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ}
            strokeLinecap="round" className="transition-all duration-500" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-stone-900 dark:text-stone-50">{Math.round(pct)}%</span>
      </div>
      <p className="text-xs text-stone-500 dark:text-stone-400">{label}</p>
      <p className="text-xs font-semibold text-stone-900 dark:text-stone-50">{Math.round(value)}g</p>
    </div>
  )
}

export default function NutritionPage() {
  const { householdId } = useHousehold()
  const { user } = useAuth()
  const supabase = createClient()
  const today = todayISO()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [goals, setGoals] = useState<NutritionGoals | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState<FoodEntry['meal_type']>('breakfast')
  const [loading, setLoading] = useState(true)
  const [showBarcode, setShowBarcode] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [barcodeSearching, setBarcodeSearching] = useState(false)

  useEffect(() => {
    if (!user || !householdId) return
    Promise.all([
      supabase.from('food_entries').select('*').eq('user_id', user.id).eq('entry_date', today).order('created_at'),
      supabase.from('nutrition_goals').select('*').eq('user_id', user.id).single(),
    ]).then(([{ data: e }, { data: g }]) => {
      setEntries(e ?? [])
      setGoals(g ?? null)
      setLoading(false)
    })
  }, [user, householdId])

  const totalCalories = entries.reduce((s, e) => s + e.calories, 0)
  const totalProtein = entries.reduce((s, e) => s + (e.protein_g ?? 0), 0)
  const totalCarbs = entries.reduce((s, e) => s + (e.carbs_g ?? 0), 0)
  const totalFat = entries.reduce((s, e) => s + (e.fat_g ?? 0), 0)

  const doSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const r = await searchFoods(query, process.env.NEXT_PUBLIC_USDA_API_KEY)
      setResults(r)
    } finally {
      setSearching(false)
    }
  }

  const searchByBarcode = async (barcode: string) => {
    if (!barcode.trim()) return
    setBarcodeSearching(true)
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
      if (!res.ok) throw new Error('Product not found')
      const data = await res.json()
      if (data.product) {
        const product = data.product
        const food: FoodSearchResult = {
          fdcId: barcode,
          description: product.product_name || 'Unknown product',
          brandOwner: product.brands || null,
          calories: product.nutriments?.['energy-kcal'] || 0,
          protein_g: product.nutriments?.proteins || 0,
          carbs_g: product.nutriments?.carbohydrates || 0,
          fat_g: product.nutriments?.fat || 0,
          fiber_g: product.nutriments?.fiber || 0,
          sodium_mg: (product.nutriments?.salt || 0) * 1000,
        }
        setResults([food])
        setBarcodeInput('')
      } else {
        alert('Product not found in database')
      }
    } catch (err) {
      alert('Error scanning barcode. Try searching manually.')
    } finally {
      setBarcodeSearching(false)
    }
  }

  const logFood = async (food: FoodSearchResult) => {
    if (!user || !householdId) return
    const { data } = await supabase.from('food_entries').insert({
      user_id: user.id,
      household_id: householdId,
      entry_date: today,
      meal_type: selectedMeal,
      food_name: food.description,
      brand: food.brandOwner ?? null,
      calories: food.calories,
      protein_g: food.protein_g,
      carbs_g: food.carbs_g,
      fat_g: food.fat_g,
      fiber_g: food.fiber_g,
      sodium_mg: food.sodium_mg,
    }).select().single()
    if (data) setEntries(prev => [...prev, data])
    setShowAdd(false)
    setQuery('')
    setResults([])
  }

  if (loading) return <div className="p-8 text-stone-400">Loading…</div>

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Nutrition — {today}</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition-colors">
          <Plus className="w-4 h-4" /> Log food
        </button>
      </div>

      {/* Calorie summary */}
      <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-3xl font-bold text-stone-900 dark:text-stone-50">{Math.round(totalCalories)}</p>
            <p className="text-sm text-stone-400">of {goals?.calories_goal ?? '—'} kcal</p>
          </div>
          {goals?.calories_goal && (
            <div className="w-24">
              <div className="h-2 rounded-full bg-stone-200 dark:bg-stone-700">
                <div
                  className="h-2 rounded-full bg-rose-500 transition-all"
                  style={{ width: `${Math.min(100, (totalCalories / goals.calories_goal) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-8 justify-around">
          <MacroRing value={totalProtein} goal={goals?.protein_g ?? 150} label="Protein" color="#3b82f6" />
          <MacroRing value={totalCarbs} goal={goals?.carbs_g ?? 250} label="Carbs" color="#f59e0b" />
          <MacroRing value={totalFat} goal={goals?.fat_g ?? 65} label="Fat" color="#ef4444" />
        </div>
      </div>

      {/* Entry list */}
      {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(meal => {
        const mealEntries = entries.filter(e => e.meal_type === meal)
        if (mealEntries.length === 0) return null
        return (
          <div key={meal} className="mb-4">
            <h3 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
              {meal} · {Math.round(mealEntries.reduce((s, e) => s + e.calories, 0))} kcal
            </h3>
            <div className="space-y-2">
              {mealEntries.map(entry => (
                <div key={entry.id} className="rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-4 py-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-stone-900 dark:text-stone-50">{entry.food_name}</p>
                      {entry.brand && <p className="text-xs text-stone-400">{entry.brand}</p>}
                    </div>
                    <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 whitespace-nowrap ml-2">{Math.round(entry.calories)} kcal</p>
                  </div>
                  <div className="flex gap-3 text-xs text-stone-500 dark:text-stone-400">
                    <span>P {Math.round(entry.protein_g ?? 0)}g</span>
                    <span>C {Math.round(entry.carbs_g ?? 0)}g</span>
                    <span>F {Math.round(entry.fat_g ?? 0)}g</span>
                    {entry.fiber_g ? <span>Fiber {Math.round(entry.fiber_g)}g</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Log food modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-stone-900 dark:text-stone-50">Log food</h3>
              <button onClick={() => { setShowAdd(false); setResults([]); setQuery(''); setShowBarcode(false); }} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded">
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            <select
              value={selectedMeal}
              onChange={e => setSelectedMeal(e.target.value as FoodEntry['meal_type'])}
              className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 mb-4 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              {['breakfast', 'lunch', 'dinner', 'snack'].map(m => (
                <option key={m} value={m} className="capitalize">{m.charAt(0).toUpperCase() + m.slice(1)}</option>
              ))}
            </select>

            {showBarcode ? (
              <div className="mb-4">
                <div className="flex gap-2 mb-3">
                  <input
                    value={barcodeInput}
                    onChange={e => setBarcodeInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchByBarcode(barcodeInput)}
                    placeholder="Enter or scan barcode…"
                    autoFocus
                    className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button onClick={() => setShowBarcode(false)} className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-700 text-sm font-medium">
                    Back
                  </button>
                </div>
                <button onClick={() => searchByBarcode(barcodeInput)} disabled={barcodeSearching} className="w-full py-2 rounded-xl bg-rose-500 text-white text-sm font-medium disabled:opacity-50">
                  {barcodeSearching ? 'Searching…' : 'Search'}
                </button>
              </div>
            ) : (
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && doSearch()}
                    placeholder="Search USDA food database…"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <button onClick={doSearch} disabled={searching} className="px-4 py-2 rounded-xl bg-stone-800 dark:bg-stone-700 text-white text-sm font-medium disabled:opacity-50">
                  {searching ? '…' : 'Search'}
                </button>
                <button onClick={() => setShowBarcode(true)} className="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600">
                  <Barcode className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="overflow-y-auto flex-1 space-y-2">
              {results.map(r => (
                <button
                  key={r.fdcId}
                  onClick={() => logFood(r)}
                  className="w-full text-left rounded-xl border border-stone-200 dark:border-stone-700 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-50 line-clamp-1">{r.description}</p>
                  {r.brandOwner && <p className="text-xs text-stone-500 dark:text-stone-400">{r.brandOwner}</p>}
                  <p className="text-xs text-stone-400 mt-1">
                    {Math.round(r.calories)} kcal · P {Math.round(r.protein_g)}g · C {Math.round(r.carbs_g)}g · F {Math.round(r.fat_g)}g
                  </p>
                  {(r.fiber_g || r.sodium_mg) && (
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {r.fiber_g ? `Fiber ${Math.round(r.fiber_g)}g` : ''}{r.fiber_g && r.sodium_mg ? ' · ' : ''}{r.sodium_mg ? `Sodium ${Math.round(r.sodium_mg)}mg` : ''}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
