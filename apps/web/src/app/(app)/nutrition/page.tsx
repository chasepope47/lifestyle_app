'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { Plus, Search, Barcode, X, ChevronLeft, ChevronRight, Trash2, CalendarDays } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import { ModulePage } from '@/components/layout/ModulePage'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { useHousehold } from '@/providers/HouseholdProvider'
import { useAuth } from '@/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { todayISO } from '@lifestyle/shared'
import { searchFoods, type FoodSearchResult } from '@lifestyle/integrations'
import type { Database } from '@lifestyle/db'

type FoodEntry = Database['public']['Tables']['food_entries']['Row']
type NutritionGoals = Database['public']['Tables']['nutrition_goals']['Row']

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'] as const
const MEAL_ICONS: Record<string, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }

function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
  const pct = goal > 0 ? Math.min(100, (consumed / goal) * 100) : 0
  const r = 52
  const circ = 2 * Math.PI * r
  const over = goal > 0 && consumed > goal
  const remaining = Math.max(0, goal - consumed)
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={r} fill="none" stroke="#292524" strokeWidth="10" />
          <circle cx="64" cy="64" r={r} fill="none" stroke={over ? '#ef4444' : '#10b981'} strokeWidth="10"
            strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ}
            strokeLinecap="round" className="transition-all duration-700" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="text-2xl font-bold text-stone-50 leading-none">{Math.round(consumed)}</span>
          <span className="text-xs text-stone-400">kcal eaten</span>
        </div>
      </div>
      <div className="flex gap-8 mt-4 text-center">
        <div>
          <p className="text-[11px] text-stone-500 mb-0.5">Goal</p>
          <p className="text-sm font-bold text-stone-200">{goal > 0 ? goal : '—'}</p>
        </div>
        <div>
          <p className="text-[11px] text-stone-500 mb-0.5">{over ? 'Over' : 'Remaining'}</p>
          <p className={`text-sm font-bold ${over ? 'text-red-400' : 'text-emerald-400'}`}>
            {goal > 0 ? Math.round(over ? consumed - goal : remaining) : '—'}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-stone-500 mb-0.5">Burned</p>
          <p className="text-sm font-bold text-orange-400">—</p>
        </div>
      </div>
    </div>
  )
}

function NutrientBar({ label, value, goal, color, unit = 'g' }: { label: string; value: number; goal: number; color: string; unit?: string }) {
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0
  const over = goal > 0 && value > goal
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-stone-300 font-medium">{label}</span>
        <span className="text-stone-400">
          <span className={`font-semibold ${over ? 'text-red-400' : 'text-stone-50'}`}>{Math.round(value)}</span>
          {goal > 0 && <span className="text-stone-500"> / {goal}{unit}</span>}
        </span>
      </div>
      <div className="h-2 bg-stone-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: over ? '#ef4444' : color }} />
      </div>
    </div>
  )
}

function MacroBar({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const total = protein * 4 + carbs * 4 + fat * 9
  if (total === 0) return null
  const pPct = ((protein * 4) / total) * 100
  const cPct = ((carbs * 4) / total) * 100
  const fPct = ((fat * 9) / total) * 100
  return (
    <div>
      <p className="text-xs text-stone-500 mb-2">Macro ratio (by calories)</p>
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${pPct}%` }} title={`Protein ${pPct.toFixed(0)}%`} />
        <div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${cPct}%` }} title={`Carbs ${cPct.toFixed(0)}%`} />
        <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${fPct}%` }} title={`Fat ${fPct.toFixed(0)}%`} />
      </div>
      <div className="flex gap-4 mt-2">
        <span className="flex items-center gap-1 text-xs text-stone-400"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> P {pPct.toFixed(0)}%</span>
        <span className="flex items-center gap-1 text-xs text-stone-400"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> C {cPct.toFixed(0)}%</span>
        <span className="flex items-center gap-1 text-xs text-stone-400"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> F {fPct.toFixed(0)}%</span>
      </div>
    </div>
  )
}

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function CalendarModal({
  selectedDate,
  loggedDates,
  calendarMonth,
  onMonthChange,
  onSelect,
  onClose,
}: {
  selectedDate: string
  loggedDates: Set<string>
  calendarMonth: Date
  onMonthChange: (d: Date) => void
  onSelect: (date: string) => void
  onClose: () => void
}) {
  const today = todayISO()
  const year = calendarMonth.getFullYear()
  const month = calendarMonth.getMonth()
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const toISO = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-stone-900 border border-stone-700 rounded-2xl p-5 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => onMonthChange(new Date(year, month - 1))} className="p-2 rounded-lg hover:bg-stone-800 text-stone-400">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="font-semibold text-stone-50">
            {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={() => onMonthChange(new Date(year, month + 1))}
            disabled={year > new Date().getFullYear() || (year === new Date().getFullYear() && month >= new Date().getMonth())}
            className="p-2 rounded-lg hover:bg-stone-800 text-stone-400 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day of week headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map(d => (
            <div key={d} className="text-center text-[11px] font-medium text-stone-500 py-1">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const iso = toISO(day)
            const isSelected = iso === selectedDate
            const isToday = iso === today
            const isFuture = iso > today
            const hasEntries = loggedDates.has(iso)
            return (
              <button
                key={i}
                disabled={isFuture}
                onClick={() => { onSelect(iso); onClose() }}
                className={`relative flex flex-col items-center justify-center h-10 w-full rounded-xl text-sm font-medium transition-colors
                  ${isSelected ? 'bg-emerald-600 text-white' : isToday ? 'bg-stone-700 text-emerald-400' : isFuture ? 'text-stone-700 cursor-not-allowed' : 'text-stone-300 hover:bg-stone-800'}`}
              >
                {day}
                {hasEntries && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-stone-800">
          <span className="flex items-center gap-1.5 text-xs text-stone-500">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Logged
          </span>
          <span className="flex items-center gap-1.5 text-xs text-stone-500">
            <span className="w-3 h-3 rounded-md bg-stone-700 inline-block" /> Today
          </span>
        </div>
      </div>
    </div>
  )
}

export default function NutritionPage() {
  const { householdId } = useHousehold()
  const { user } = useAuth()
  const supabase = createClient()
  const [viewDate, setViewDate] = useState(todayISO())
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
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set(MEAL_ORDER))
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [barcodeError, setBarcodeError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [loggedDates, setLoggedDates] = useState<Set<string>>(new Set())
  const [pendingFood, setPendingFood] = useState<FoodSearchResult | null>(null)
  const [resultSource, setResultSource] = useState<'barcode' | 'search'>('search')
  const [quantity, setQuantity] = useState(1)
  const [weightValue, setWeightValue] = useState('100')
  const [weightUnit, setWeightUnit] = useState<'g' | 'oz' | 'lbs'>('g')

  useEffect(() => {
    if (!user || !householdId) return
    setLoading(true)
    Promise.all([
      supabase.from('food_entries').select('*').eq('user_id', user.id).eq('entry_date', viewDate).order('created_at'),
      supabase.from('nutrition_goals').select('*').eq('user_id', user.id).single(),
    ]).then(([{ data: e }, { data: g }]) => {
      setEntries(e ?? [])
      setGoals(g ?? null)
      setLoading(false)
    })
  }, [user, householdId, viewDate])

  useEffect(() => {
    if (!user) return
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const lastDay = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`
    supabase
      .from('food_entries')
      .select('entry_date')
      .eq('user_id', user.id)
      .gte('entry_date', firstDay)
      .lte('entry_date', lastDay)
      .then(({ data }) => {
        setLoggedDates(new Set((data ?? []).map(r => r.entry_date)))
      })
  }, [user, calendarMonth])

  const shiftDate = (days: number) => {
    const d = new Date(viewDate)
    d.setDate(d.getDate() + days)
    setViewDate(d.toISOString().split('T')[0])
  }

  const isToday = viewDate === todayISO()
  const displayDate = new Date(viewDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  const controlsRef = useRef<{ stop: () => void } | null>(null)

  const toGrams = (val: number, unit: 'g' | 'oz' | 'lbs') => {
    if (unit === 'oz') return val * 28.3495
    if (unit === 'lbs') return val * 453.592
    return val
  }

  const handleSelectFood = (food: FoodSearchResult) => {
    setPendingFood(food)
    setQuantity(1)
    setWeightUnit('g')
    // Pre-fill weight from serving size if known, otherwise 100g
    setWeightValue(
      resultSource === 'search' && food.servingSizeG
        ? String(Math.round(food.servingSizeG * 10) / 10)
        : '100'
    )
  }

  const handleQuantityChange = (newQty: number, food: FoodSearchResult) => {
    setQuantity(newQty)
    if (food.servingSizeG) {
      const grams = food.servingSizeG * newQty
      const converted = weightUnit === 'oz' ? grams / 28.3495
                      : weightUnit === 'lbs' ? grams / 453.592
                      : grams
      setWeightValue(String(Math.round(converted * 10) / 10))
    }
  }

  const handleUnitChange = (newUnit: 'g' | 'oz' | 'lbs') => {
    const currentGrams = toGrams(parseFloat(weightValue) || 0, weightUnit)
    const converted = newUnit === 'oz' ? currentGrams / 28.3495
                    : newUnit === 'lbs' ? currentGrams / 453.592
                    : currentGrams
    setWeightValue(String(Math.round(converted * 10) / 10))
    setWeightUnit(newUnit)
  }

  // Defined before startCamera so the ZXing callback can reference it
  const searchByBarcode = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return
    setBarcodeSearching(true)
    setBarcodeError(null)
    setResults([])
    setPendingFood(null)
    try {
      const res = await fetch(`/api/nutrition/barcode?code=${encodeURIComponent(barcode)}`)
      const data = await res.json()
      if (!res.ok) {
        setBarcodeError(data.error ?? 'Product not found. Try searching by name below.')
      } else {
        setResults([data as FoodSearchResult])
        setResultSource('barcode')
        // Close camera view so the result is front-and-center
        setShowBarcode(false)
      }
    } catch {
      setBarcodeError('Could not search — check your connection.')
    } finally {
      setBarcodeSearching(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop()
    controlsRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraActive(false)
  }, [])

  const startCamera = useCallback(async () => {
    setCameraError(null)
    try {
      const codeReader = new BrowserMultiFormatReader()
      const controls = await codeReader.decodeFromConstraints(
        { video: { facingMode: 'environment' } },
        videoRef.current!,
        (result) => {
          if (result) {
            controls.stop()
            controlsRef.current = null
            setCameraActive(false)
            const code = result.getText()
            setBarcodeInput(code)
            searchByBarcode(code)
          }
        }
      )
      controlsRef.current = controls
      setCameraActive(true)
    } catch {
      setCameraError('Camera access denied — check permissions or type the barcode below.')
    }
  }, [searchByBarcode])

  useEffect(() => {
    if (showBarcode) {
      setBarcodeError(null)
      setResults([])
      startCamera()
    } else {
      stopCamera()
      setBarcodeInput('')
      setBarcodeError(null)
    }
    return () => { stopCamera() }
  }, [showBarcode, startCamera, stopCamera])

  const totals = {
    calories: entries.reduce((s, e) => s + e.calories, 0),
    protein: entries.reduce((s, e) => s + (e.protein_g ?? 0), 0),
    carbs: entries.reduce((s, e) => s + (e.carbs_g ?? 0), 0),
    fat: entries.reduce((s, e) => s + (e.fat_g ?? 0), 0),
    fiber: entries.reduce((s, e) => s + (e.fiber_g ?? 0), 0),
    sodium: entries.reduce((s, e) => s + (e.sodium_mg ?? 0), 0),
  }

  const doSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    setPendingFood(null)
    try {
      const r = await searchFoods(query, process.env.NEXT_PUBLIC_USDA_API_KEY)
      setResults(r)
      setResultSource('search')
    } finally {
      setSearching(false)
    }
  }

  const logFood = async (food: FoodSearchResult, multiplier: number = 1) => {
    if (!user || !householdId) return
    const m = multiplier
    const { data } = await supabase.from('food_entries').insert({
      user_id: user.id,
      household_id: householdId,
      entry_date: viewDate,
      meal_type: selectedMeal,
      food_name: food.description,
      brand: food.brandOwner ?? null,
      calories: Math.round(food.calories * m),
      protein_g: Math.round((food.protein_g ?? 0) * m * 10) / 10,
      carbs_g: Math.round((food.carbs_g ?? 0) * m * 10) / 10,
      fat_g: Math.round((food.fat_g ?? 0) * m * 10) / 10,
      fiber_g: Math.round((food.fiber_g ?? 0) * m * 10) / 10,
      sodium_mg: Math.round((food.sodium_mg ?? 0) * m),
    }).select().single()
    if (data) setEntries(prev => [...prev, data])
    setShowAdd(false)
    setQuery('')
    setResults([])
    setPendingFood(null)
  }

  const deleteEntry = async (id: string) => {
    await supabase.from('food_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const toggleMeal = (meal: string) => {
    setExpandedMeals(prev => {
      const next = new Set(prev)
      next.has(meal) ? next.delete(meal) : next.add(meal)
      return next
    })
  }

  if (loading) return <div className="p-8 text-stone-400">Loading…</div>

  return (
    <ModulePage module="nutrition">
      <PageHero
        title="Nutrition"
        subtitle="Log food & track macros"
        gradient="linear-gradient(135deg, #001a0e 0%, #023a1e 35%, #001a12 65%, #020617 100%)"
        accentHex="#34d399"
        overlay={true}
      />
      <div className="px-3 sm:px-4 pt-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button onClick={() => shiftDate(-1)} className="p-2 rounded-lg hover:bg-stone-800 text-stone-400">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              const d = new Date(viewDate + 'T12:00:00')
              setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1))
              setShowCalendar(true)
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-stone-800 transition-colors group"
          >
            <CalendarDays className="w-4 h-4 text-stone-500 group-hover:text-stone-300" />
            <div className="text-left">
              <h1 className="text-lg font-bold text-stone-50 leading-tight">{isToday ? 'Today' : displayDate}</h1>
              {!isToday && <p className="text-xs text-stone-500">{displayDate}</p>}
            </div>
          </button>
          <button onClick={() => shiftDate(1)} disabled={isToday} className="p-2 rounded-lg hover:bg-stone-800 text-stone-400 disabled:opacity-30">
            <ChevronRight className="w-5 h-5" />
          </button>
          {!isToday && (
            <button onClick={() => setViewDate(todayISO())} className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded-lg hover:bg-stone-800">
              Today
            </button>
          )}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Log food
        </button>
      </div>

      {/* Calorie + macro hero */}
      <div className="rounded-2xl bg-stone-800 border border-stone-700 p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <CalorieRing consumed={totals.calories} goal={goals?.calories_goal ?? 2000} />
          <div className="flex-1 w-full space-y-3">
            <MacroBar protein={totals.protein} carbs={totals.carbs} fat={totals.fat} />
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-4">
              <NutrientBar label="Protein" value={totals.protein} goal={goals?.protein_g ?? 150} color="#3b82f6" />
              <NutrientBar label="Carbs" value={totals.carbs} goal={goals?.carbs_g ?? 250} color="#f59e0b" />
              <NutrientBar label="Fat" value={totals.fat} goal={goals?.fat_g ?? 65} color="#ef4444" />
              <NutrientBar label="Fiber" value={totals.fiber} goal={goals?.fiber_g ?? 25} color="#10b981" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary nutrients */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl bg-stone-800 border border-stone-700 p-4">
          <p className="text-xs text-stone-500 mb-1">Sodium</p>
          <p className={`text-xl font-bold ${totals.sodium > 2300 ? 'text-red-400' : 'text-stone-50'}`}>{Math.round(totals.sodium)}<span className="text-sm font-normal text-stone-400 ml-1">mg</span></p>
          <div className="h-1.5 bg-stone-700 rounded-full mt-2 overflow-hidden">
            <div className="h-full rounded-full bg-orange-400 transition-all" style={{ width: `${Math.min(100, (totals.sodium / 2300) * 100)}%` }} />
          </div>
          <p className="text-[10px] text-stone-500 mt-1">Goal: 2300mg</p>
        </div>
        <div className="rounded-xl bg-stone-800 border border-stone-700 p-4">
          <p className="text-xs text-stone-500 mb-1">Fiber</p>
          <p className={`text-xl font-bold ${totals.fiber >= (goals?.fiber_g ?? 25) ? 'text-emerald-400' : 'text-stone-50'}`}>{Math.round(totals.fiber)}<span className="text-sm font-normal text-stone-400 ml-1">g</span></p>
          <div className="h-1.5 bg-stone-700 rounded-full mt-2 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, (totals.fiber / (goals?.fiber_g ?? 25)) * 100)}%` }} />
          </div>
          <p className="text-[10px] text-stone-500 mt-1">Goal: {goals?.fiber_g ?? 25}g</p>
        </div>
        <div className="rounded-xl bg-stone-800 border border-stone-700 p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-stone-500 mb-1">Meals logged</p>
          <p className="text-xl font-bold text-stone-50">{entries.length}<span className="text-sm font-normal text-stone-400 ml-1">items</span></p>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {MEAL_ORDER.map(m => {
              const count = entries.filter(e => e.meal_type === m).length
              return count > 0 ? (
                <span key={m} className="text-[10px] bg-stone-700 text-stone-300 px-1.5 py-0.5 rounded-md capitalize">{m}</span>
              ) : null
            })}
            {entries.length === 0 && <span className="text-[10px] text-stone-600">Nothing logged yet</span>}
          </div>
        </div>
      </div>

      {/* Meal sections */}
      <div className="space-y-3">
        {MEAL_ORDER.map(meal => {
          const mealEntries = entries.filter(e => e.meal_type === meal)
          const mealCals = mealEntries.reduce((s, e) => s + e.calories, 0)
          const expanded = expandedMeals.has(meal)
          return (
            <div key={meal} className="rounded-2xl bg-stone-800 border border-stone-700 overflow-hidden">
              <button
                onClick={() => toggleMeal(meal)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-stone-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{MEAL_ICONS[meal]}</span>
                  <div className="text-left">
                    <p className="font-semibold text-stone-50 capitalize">{meal}</p>
                    <p className="text-xs text-stone-400">{mealEntries.length} items · {Math.round(mealCals)} kcal</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedMeal(meal); setShowAdd(true) }}
                    className="p-1.5 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-300 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className={`w-4 h-4 text-stone-500 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                </div>
              </button>

              {expanded && mealEntries.length > 0 && (
                <div className="px-4 pb-4 space-y-2">
                  {mealEntries.map(entry => (
                    <div key={entry.id} className="rounded-xl bg-stone-900 border border-stone-700 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-stone-50 leading-tight">{entry.food_name}</p>
                          {entry.brand && <p className="text-xs text-stone-500 mt-0.5">{entry.brand}</p>}
                        </div>
                        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                          <p className="text-sm font-bold text-stone-50">{Math.round(entry.calories)} kcal</p>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="p-1 rounded hover:bg-stone-700 text-stone-600 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-lg bg-stone-800 px-3 py-2 text-center">
                          <p className="text-[10px] text-stone-500 mb-0.5">Protein</p>
                          <p className="text-sm font-semibold text-blue-400">{Math.round(entry.protein_g ?? 0)}g</p>
                        </div>
                        <div className="rounded-lg bg-stone-800 px-3 py-2 text-center">
                          <p className="text-[10px] text-stone-500 mb-0.5">Carbs</p>
                          <p className="text-sm font-semibold text-yellow-400">{Math.round(entry.carbs_g ?? 0)}g</p>
                        </div>
                        <div className="rounded-lg bg-stone-800 px-3 py-2 text-center">
                          <p className="text-[10px] text-stone-500 mb-0.5">Fat</p>
                          <p className="text-sm font-semibold text-red-400">{Math.round(entry.fat_g ?? 0)}g</p>
                        </div>
                        {(entry.fiber_g ?? 0) > 0 && (
                          <div className="rounded-lg bg-stone-800 px-3 py-2 text-center">
                            <p className="text-[10px] text-stone-500 mb-0.5">Fiber</p>
                            <p className="text-sm font-semibold text-emerald-400">{Math.round(entry.fiber_g ?? 0)}g</p>
                          </div>
                        )}
                        {(entry.sodium_mg ?? 0) > 0 && (
                          <div className="rounded-lg bg-stone-800 px-3 py-2 text-center">
                            <p className="text-[10px] text-stone-500 mb-0.5">Sodium</p>
                            <p className="text-sm font-semibold text-orange-400">{Math.round(entry.sodium_mg ?? 0)}mg</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {expanded && mealEntries.length === 0 && (
                <div className="px-5 pb-5">
                  <button
                    onClick={() => { setSelectedMeal(meal); setShowAdd(true) }}
                    className="w-full py-3 rounded-xl border border-dashed border-stone-600 text-stone-500 text-sm hover:border-stone-500 hover:text-stone-400 transition-colors"
                  >
                    + Add {meal}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Calendar modal */}
      {showCalendar && (
        <CalendarModal
          selectedDate={viewDate}
          loggedDates={loggedDates}
          calendarMonth={calendarMonth}
          onMonthChange={month => {
            setCalendarMonth(month)
          }}
          onSelect={date => {
            setViewDate(date)
          }}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {/* Log food modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-stone-900 rounded-2xl p-6 w-full max-w-md max-h-[90vh] flex flex-col border border-stone-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-stone-50">Log food</h3>
              <button onClick={() => { setShowAdd(false); setResults([]); setQuery(''); setShowBarcode(false); stopCamera(); setPendingFood(null) }} className="p-1 hover:bg-stone-800 rounded">
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              {MEAL_ORDER.map(m => (
                <button
                  key={m}
                  onClick={() => setSelectedMeal(m)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${selectedMeal === m ? 'bg-emerald-600 text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'}`}
                >
                  {m}
                </button>
              ))}
            </div>

            {showBarcode ? (
              <div className="mb-4 space-y-3">
                {/* Camera view */}
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  {cameraActive && (
                    <>
                      {/* Scanning frame overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="relative w-56 h-28">
                          <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl" />
                          <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr" />
                          <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl" />
                          <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br" />
                          {/* Scanning line */}
                          <div className="absolute inset-x-0 top-1/2 h-0.5 bg-emerald-400/60 animate-pulse" />
                        </div>
                      </div>
                      <p className="absolute bottom-2 inset-x-0 text-center text-xs text-white/70">
                        Point camera at barcode
                      </p>
                    </>
                  )}
                  {!cameraActive && !cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                      <p className="text-xs text-red-400 mb-3">{cameraError}</p>
                    </div>
                  )}
                </div>

                {/* Status: searching / found / error */}
                {barcodeSearching && (
                  <div className="flex items-center justify-center gap-2 py-2 text-sm text-emerald-400">
                    <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    Searching for product…
                  </div>
                )}
                {barcodeError && !barcodeSearching && (
                  <p className="text-xs text-red-400 text-center py-1">{barcodeError}</p>
                )}
                {!barcodeSearching && !barcodeError && results.length > 0 && (
                  <p className="text-xs text-emerald-400 text-center py-1">Product found — tap below to log it</p>
                )}

                {/* Scanned / manual input */}
                <div className="flex gap-2">
                  <input
                    value={barcodeInput}
                    onChange={e => { setBarcodeInput(e.target.value); setBarcodeError(null) }}
                    onKeyDown={e => e.key === 'Enter' && searchByBarcode(barcodeInput)}
                    placeholder={cameraActive ? 'Aim camera at barcode…' : 'Type barcode manually…'}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-stone-600 bg-stone-800 text-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={() => searchByBarcode(barcodeInput)}
                    disabled={barcodeSearching || !barcodeInput.trim()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium disabled:opacity-40 hover:bg-emerald-700 transition-colors"
                  >
                    {barcodeSearching ? '…' : 'Search'}
                  </button>
                </div>

                <button
                  onClick={() => setShowBarcode(false)}
                  className="w-full py-2 rounded-xl bg-stone-800 text-stone-400 text-sm hover:bg-stone-700 transition-colors"
                >
                  ← Back to name search
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
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-600 bg-stone-800 text-stone-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button onClick={doSearch} disabled={searching} className="px-4 py-2 rounded-xl bg-stone-700 text-stone-300 text-sm font-medium disabled:opacity-50">
                  {searching ? '…' : 'Go'}
                </button>
                <button onClick={() => setShowBarcode(true)} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700">
                  <Barcode className="w-4 h-4" />
                </button>
              </div>
            )}

            {pendingFood ? (
              <div className="flex-1 flex flex-col overflow-y-auto">
                {/* Food header */}
                <div className="rounded-xl bg-stone-800 border border-stone-700 p-4 mb-4">
                  <p className="text-sm font-semibold text-stone-50 leading-snug">{pendingFood.description}</p>
                  {pendingFood.brandOwner && <p className="text-xs text-stone-500 mt-0.5">{pendingFood.brandOwner}</p>}
                </div>

                {resultSource === 'barcode' ? (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-stone-300 mb-3">How many did you have?</p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(q => Math.max(0.5, Math.round((q - 0.5) * 10) / 10))}
                        className="w-11 h-11 rounded-xl bg-stone-700 text-stone-100 text-2xl flex items-center justify-center hover:bg-stone-600 transition-colors"
                      >−</button>
                      <span className="flex-1 text-center text-2xl font-bold text-stone-50">
                        {quantity % 1 === 0 ? quantity : quantity.toFixed(1)}
                      </span>
                      <button
                        onClick={() => setQuantity(q => Math.round((q + 0.5) * 10) / 10)}
                        className="w-11 h-11 rounded-xl bg-stone-700 text-stone-100 text-2xl flex items-center justify-center hover:bg-stone-600 transition-colors"
                      >+</button>
                    </div>
                    <p className="text-xs text-stone-500 text-center mt-2">
                      {quantity === 1 ? '1 item / serving' : `${quantity % 1 === 0 ? quantity : quantity.toFixed(1)} items / servings`}
                    </p>
                  </div>
                ) : (
                  <div className="mb-4 space-y-4">
                    {/* Quantity stepper */}
                    <div>
                      <p className="text-sm font-medium text-stone-300 mb-2">How many servings?</p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleQuantityChange(Math.max(0.5, Math.round((quantity - 0.5) * 10) / 10), pendingFood!)}
                          className="w-11 h-11 rounded-xl bg-stone-700 text-stone-100 text-2xl flex items-center justify-center hover:bg-stone-600 transition-colors"
                        >−</button>
                        <span className="flex-1 text-center text-2xl font-bold text-stone-50">
                          {quantity % 1 === 0 ? quantity : quantity.toFixed(1)}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(Math.round((quantity + 0.5) * 10) / 10, pendingFood!)}
                          className="w-11 h-11 rounded-xl bg-stone-700 text-stone-100 text-2xl flex items-center justify-center hover:bg-stone-600 transition-colors"
                        >+</button>
                      </div>
                      {pendingFood?.servingSizeG ? (
                        <p className="text-xs text-stone-500 text-center mt-1.5">
                          1 serving = {pendingFood.servingSizeG % 1 === 0 ? pendingFood.servingSizeG : pendingFood.servingSizeG.toFixed(1)}g
                        </p>
                      ) : (
                        <p className="text-xs text-stone-500 text-center mt-1.5">No serving size on file — adjust weight below</p>
                      )}
                    </div>

                    {/* Weight input (auto-fills from qty × serving, still editable) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-stone-300">Or enter exact weight</p>
                        <span className="text-xs text-stone-500">Values are per 100g</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={weightValue}
                          onChange={e => setWeightValue(e.target.value)}
                          min="0"
                          step="any"
                          className="flex-1 px-4 py-2.5 rounded-xl border border-stone-600 bg-stone-800 text-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <select
                          value={weightUnit}
                          onChange={e => handleUnitChange(e.target.value as 'g' | 'oz' | 'lbs')}
                          className="px-3 py-2.5 rounded-xl border border-stone-600 bg-stone-800 text-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="g">g</option>
                          <option value="oz">oz</option>
                          <option value="lbs">lbs</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scaled nutrition preview */}
                {(() => {
                  const m = resultSource === 'barcode'
                    ? quantity
                    : toGrams(parseFloat(weightValue) || 0, weightUnit) / 100
                  return (
                    <div className="rounded-xl bg-stone-800 border border-stone-700 p-4 mb-4">
                      <p className="text-xs text-stone-500 mb-3">Nutritional totals</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-stone-500">Calories</p>
                          <p className="text-xl font-bold text-stone-50">{Math.round(pendingFood.calories * m)} <span className="text-sm font-normal text-stone-400">kcal</span></p>
                        </div>
                        <div>
                          <p className="text-xs text-stone-500">Protein</p>
                          <p className="text-xl font-bold text-blue-400">{(pendingFood.protein_g * m).toFixed(1)}<span className="text-sm font-normal text-stone-400">g</span></p>
                        </div>
                        <div>
                          <p className="text-xs text-stone-500">Carbs</p>
                          <p className="text-xl font-bold text-yellow-400">{(pendingFood.carbs_g * m).toFixed(1)}<span className="text-sm font-normal text-stone-400">g</span></p>
                        </div>
                        <div>
                          <p className="text-xs text-stone-500">Fat</p>
                          <p className="text-xl font-bold text-red-400">{(pendingFood.fat_g * m).toFixed(1)}<span className="text-sm font-normal text-stone-400">g</span></p>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                <div className="flex gap-2">
                  <button
                    onClick={() => setPendingFood(null)}
                    className="flex-1 py-2.5 rounded-xl bg-stone-800 text-stone-400 text-sm font-medium hover:bg-stone-700 transition-colors"
                  >← Back</button>
                  <button
                    onClick={() => {
                      const m = resultSource === 'barcode'
                        ? quantity
                        : toGrams(parseFloat(weightValue) || 0, weightUnit) / 100
                      logFood(pendingFood, m)
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
                  >Log food</button>
                </div>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1 space-y-2">
                {results.map(r => (
                  <button
                    key={r.fdcId}
                    onClick={() => handleSelectFood(r)}
                    className="w-full text-left rounded-xl border border-stone-700 bg-stone-800 px-4 py-3 hover:bg-stone-700 transition-colors"
                  >
                    <p className="text-sm font-semibold text-stone-50 line-clamp-1 mb-0.5">{r.description}</p>
                    {r.brandOwner && <p className="text-xs text-stone-500 mb-2">{r.brandOwner}</p>}
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <span className="text-xs font-medium text-stone-300">{Math.round(r.calories)} kcal</span>
                      <span className="text-xs text-blue-400">P {Math.round(r.protein_g)}g</span>
                      <span className="text-xs text-yellow-400">C {Math.round(r.carbs_g)}g</span>
                      <span className="text-xs text-red-400">F {Math.round(r.fat_g)}g</span>
                      {r.fiber_g > 0 && <span className="text-xs text-emerald-400">Fiber {Math.round(r.fiber_g)}g</span>}
                      {r.sodium_mg > 0 && <span className="text-xs text-orange-400">Na {Math.round(r.sodium_mg)}mg</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </ModulePage>
  )
}
