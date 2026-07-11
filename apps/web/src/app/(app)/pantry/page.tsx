'use client'
import { useEffect, useState } from 'react'
import { Plus, Search, Trash2, ArrowLeft, Barcode, ShoppingCart, PackagePlus, Pencil, Heart } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import { ModulePage } from '@/components/layout/ModulePage'
import { useHousehold } from '@/providers/HouseholdProvider'
import { createClient } from '@/lib/supabase/client'
import { getExpirationStatus, expirationBadgeClasses, formatExpirationLabel, MEAL_TYPES, PANTRY_STORES } from '@lifestyle/shared'
import type { Database } from '@lifestyle/db'
import { PantryAssistant } from './_components/PantryAssistant'

type PantryItem = Database['public']['Tables']['pantry_items']['Row']
type MealPlan = Database['public']['Tables']['meal_plans']['Row']
type SavedRecipe = Database['public']['Tables']['saved_recipes']['Row']

const CATEGORIES = ['Produce', 'Dairy', 'Meat & Seafood', 'Frozen', 'Grains', 'Pasta', 'Canned Goods', 'Condiments', 'Pantry', 'Snacks', 'Beverages', 'Other']
const STORES: readonly string[] = PANTRY_STORES
const CATEGORY_ICONS: Record<string, string> = {
  'Produce': '🥬',
  'Dairy': '🥛',
  'Meat & Seafood': '🥩',
  'Frozen': '❄️',
  'Grains': '🌾',
  'Pasta': '🍝',
  'Canned Goods': '🥫',
  'Condiments': '🧂',
  'Pantry': '🗄️',
  'Snacks': '🍿',
  'Beverages': '🥤',
  'Other': '📦',
}
const MEAL_TYPE_ICONS: Record<string, string> = {
  breakfast: '🍳',
  lunch: '🥪',
  dinner: '🍽️',
  snack: '🍎',
}

export default function PantryPage() {
  const { householdId } = useHousehold()
  const supabase = createClient()
  const [items, setItems] = useState<PantryItem[]>([])
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([])
  const [mealPlansView, setMealPlansView] = useState<'upcoming' | 'saved'>('upcoming')
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [activeTab, setActiveTab] = useState<'pantry' | 'shopping' | 'mealplans'>('pantry')
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null)
  const [form, setForm] = useState({ name: '', category: '', quantity: '1', unit: '', price: '', expiration_date: '', store: 'No store' })
  const [restocking, setRestocking] = useState<PantryItem | null>(null)
  const [restockForm, setRestockForm] = useState({ quantity: '1', expiration_date: '', price: '', store: '' })
  const [showAddMeal, setShowAddMeal] = useState(false)
  const [mealForm, setMealForm] = useState<{ planned_date: string; meal_type: MealPlan['meal_type']; recipe_name: string; notes: string; ingredients: string; instructions: string }>({
    planned_date: '', meal_type: 'dinner', recipe_name: '', notes: '', ingredients: '', instructions: '',
  })
  const [viewingMeal, setViewingMeal] = useState<MealPlan | null>(null)
  const [editingMeal, setEditingMeal] = useState(false)
  const [showAddRecipe, setShowAddRecipe] = useState(false)
  const [recipeForm, setRecipeForm] = useState({ recipe_name: '', notes: '', ingredients: '', instructions: '' })
  const [viewingRecipe, setViewingRecipe] = useState<SavedRecipe | null>(null)
  const [planningRecipe, setPlanningRecipe] = useState<SavedRecipe | null>(null)
  const [planForm, setPlanForm] = useState<{ planned_date: string; meal_type: MealPlan['meal_type'] }>({ planned_date: '', meal_type: 'dinner' })

  const load = async () => {
    if (!householdId) return
    const [itemsRes, mealsRes, recipesRes] = await Promise.all([
      supabase.from('pantry_items').select('*').eq('household_id', householdId).order('name'),
      supabase.from('meal_plans').select('*').eq('household_id', householdId).order('planned_date'),
      supabase.from('saved_recipes').select('*').eq('household_id', householdId).order('recipe_name'),
    ])
    setItems(itemsRes.data ?? [])
    setMealPlans(mealsRes.data ?? [])
    setSavedRecipes(recipesRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [householdId])

  const emptyItemForm = { name: '', category: '', quantity: '1', unit: '', price: '', expiration_date: '', store: 'No store' }

  const openAddItem = () => {
    setEditingItem(null)
    setForm(emptyItemForm)
    setShowAdd(true)
  }

  const openEditItem = (item: PantryItem) => {
    setEditingItem(item)
    setForm({
      name: item.name,
      category: item.category ?? '',
      quantity: item.quantity != null ? String(item.quantity) : '1',
      unit: item.unit ?? '',
      price: item.price != null ? String(item.price) : '',
      expiration_date: item.expiration_date ?? '',
      store: item.store ?? 'No store',
    })
    setShowAdd(true)
  }

  const closeItemModal = () => {
    setShowAdd(false)
    setEditingItem(null)
    setForm(emptyItemForm)
  }

  const submitItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!householdId || !form.name) return
    const fields = {
      name: form.name,
      category: form.category || null,
      quantity: form.quantity ? parseFloat(form.quantity) : null,
      unit: form.unit || null,
      price: form.price ? parseFloat(form.price) : null,
      expiration_date: form.expiration_date || null,
      store: form.store || null,
    }
    if (editingItem) {
      await updateItem(editingItem.id, fields)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('pantry_items').insert({
        household_id: householdId,
        user_id: user.id,
        ...fields,
      }).select().single()
      if (data) setItems(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    }
    closeItemModal()
  }

  const deleteItem = async (id: string) => {
    await supabase.from('pantry_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const updateItem = async (id: string, updates: Partial<PantryItem>) => {
    await supabase.from('pantry_items').update(updates).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i))
  }

  const openRestock = (item: PantryItem) => {
    setRestocking(item)
    setRestockForm({
      quantity: '1',
      expiration_date: '',
      price: item.price?.toString() ?? '',
      store: item.store ?? '',
    })
  }

  const submitRestock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restocking) return
    await updateItem(restocking.id, {
      quantity: parseFloat(restockForm.quantity) || 1,
      expiration_date: restockForm.expiration_date || null,
      price: restockForm.price ? parseFloat(restockForm.price) : restocking.price,
      store: restockForm.store || restocking.store,
    })
    setRestocking(null)
  }

  const addMealPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!householdId || !mealForm.planned_date || !mealForm.recipe_name) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const ingredients = mealForm.ingredients.split('\n').map(s => s.trim()).filter(Boolean)
    const { data } = await supabase.from('meal_plans').insert({
      household_id: householdId,
      user_id: user.id,
      planned_date: mealForm.planned_date,
      meal_type: mealForm.meal_type,
      recipe_name: mealForm.recipe_name,
      notes: mealForm.notes || null,
      ingredients: ingredients.length > 0 ? ingredients : null,
      instructions: mealForm.instructions || null,
    }).select().single()
    if (data) setMealPlans(prev => [...prev, data].sort((a, b) => a.planned_date.localeCompare(b.planned_date)))
    setShowAddMeal(false)
    setMealForm({ planned_date: '', meal_type: 'dinner', recipe_name: '', notes: '', ingredients: '', instructions: '' })
  }

  const openEditMeal = (meal: MealPlan) => {
    setMealForm({
      planned_date: meal.planned_date,
      meal_type: meal.meal_type,
      recipe_name: meal.recipe_name,
      notes: meal.notes ?? '',
      ingredients: (meal.ingredients ?? []).join('\n'),
      instructions: meal.instructions ?? '',
    })
    setEditingMeal(true)
  }

  const submitEditMeal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!viewingMeal) return
    const ingredients = mealForm.ingredients.split('\n').map(s => s.trim()).filter(Boolean)
    const { data } = await supabase.from('meal_plans').update({
      planned_date: mealForm.planned_date,
      meal_type: mealForm.meal_type,
      recipe_name: mealForm.recipe_name,
      notes: mealForm.notes || null,
      ingredients: ingredients.length > 0 ? ingredients : null,
      instructions: mealForm.instructions || null,
    }).eq('id', viewingMeal.id).select().single()
    if (data) {
      setMealPlans(prev => prev.map(m => m.id === data.id ? data : m))
      setViewingMeal(data)
    }
    setEditingMeal(false)
  }

  const deleteMealPlan = async (id: string) => {
    await supabase.from('meal_plans').delete().eq('id', id)
    setMealPlans(prev => prev.filter(m => m.id !== id))
  }

  const submitAddRecipe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!householdId || !recipeForm.recipe_name) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const ingredients = recipeForm.ingredients.split('\n').map(s => s.trim()).filter(Boolean)
    const { data } = await supabase.from('saved_recipes').insert({
      household_id: householdId,
      user_id: user.id,
      recipe_name: recipeForm.recipe_name,
      notes: recipeForm.notes || null,
      ingredients: ingredients.length > 0 ? ingredients : null,
      instructions: recipeForm.instructions || null,
    }).select().single()
    if (data) setSavedRecipes(prev => [...prev, data].sort((a, b) => a.recipe_name.localeCompare(b.recipe_name)))
    setShowAddRecipe(false)
    setRecipeForm({ recipe_name: '', notes: '', ingredients: '', instructions: '' })
  }

  const deleteRecipe = async (id: string) => {
    await supabase.from('saved_recipes').delete().eq('id', id)
    setSavedRecipes(prev => prev.filter(r => r.id !== id))
    setViewingRecipe(null)
  }

  const saveMealAsRecipe = async (meal: MealPlan) => {
    if (!householdId) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('saved_recipes').insert({
      household_id: householdId,
      user_id: user.id,
      recipe_name: meal.recipe_name,
      notes: meal.notes,
      ingredients: meal.ingredients,
      instructions: meal.instructions,
    }).select().single()
    if (data) setSavedRecipes(prev => [...prev, data].sort((a, b) => a.recipe_name.localeCompare(b.recipe_name)))
  }

  const openPlanRecipe = (recipe: SavedRecipe) => {
    setPlanForm({ planned_date: '', meal_type: 'dinner' })
    setPlanningRecipe(recipe)
  }

  const submitPlanRecipe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!householdId || !planningRecipe || !planForm.planned_date) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('meal_plans').insert({
      household_id: householdId,
      user_id: user.id,
      planned_date: planForm.planned_date,
      meal_type: planForm.meal_type,
      recipe_name: planningRecipe.recipe_name,
      notes: planningRecipe.notes,
      ingredients: planningRecipe.ingredients,
      instructions: planningRecipe.instructions,
    }).select().single()
    if (data) setMealPlans(prev => [...prev, data].sort((a, b) => a.planned_date.localeCompare(b.planned_date)))
    setPlanningRecipe(null)
  }

  const filtered = items.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || i.category === selectedCategory
    const status = getExpirationStatus(i.expiration_date)
    const isEmpty = i.quantity != null && i.quantity <= 0
    const isActive = activeTab === 'pantry'
      ? !isEmpty && !['expired', 'critical'].includes(status)
      : isEmpty || ['expired', 'critical', 'soon'].includes(status)
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
  const uncategorizedStoreItems = filtered.filter(i => !i.store || !(STORES as readonly string[]).includes(i.store))
  if (uncategorizedStoreItems.length > 0) {
    groupedByStore['No store'] = [...(groupedByStore['No store'] ?? []), ...uncategorizedStoreItems]
  }

  const groupedMealPlans = mealPlans.reduce((acc, meal) => {
    (acc[meal.planned_date] ||= []).push(meal)
    return acc
  }, {} as Record<string, MealPlan[]>)
  for (const meals of Object.values(groupedMealPlans)) {
    meals.sort((a, b) => MEAL_TYPES.indexOf(a.meal_type) - MEAL_TYPES.indexOf(b.meal_type))
  }

  if (loading) return <div className="p-8 text-stone-400">Loading…</div>

  return (
    <ModulePage module="pantry">
      <PageHero
        title="Pantry"
        subtitle="Kitchen inventory & shopping list"
        gradient="linear-gradient(135deg, #1a1200 0%, #3d2800 35%, #1a1000 65%, #0d0c11 100%)"
        accentHex="#fbbf24"
        overlay={true}
        action={
          <button
            onClick={openAddItem}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-stone-900 text-sm font-semibold transition-colors"
            style={{ background: '#fbbf24' }}
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        }
      />
      <div className="px-4 pt-6 max-w-5xl mx-auto">
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
        <button
          onClick={() => setActiveTab('mealplans')}
          className={`pb-3 px-2 font-medium transition-colors ${
            activeTab === 'mealplans'
              ? 'text-stone-50 border-b-2 border-yellow-500'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          Meal Plans
        </button>
      </div>

      {activeTab === 'mealplans' ? (
        <>
          {/* Meal Plans tab */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1 rounded-lg bg-stone-800 p-1">
                <button
                  onClick={() => setMealPlansView('upcoming')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    mealPlansView === 'upcoming' ? 'bg-yellow-500 text-stone-900' : 'text-stone-300 hover:text-stone-50'
                  }`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setMealPlansView('saved')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    mealPlansView === 'saved' ? 'bg-yellow-500 text-stone-900' : 'text-stone-300 hover:text-stone-50'
                  }`}
                >
                  Saved Recipes
                </button>
              </div>
              {mealPlansView === 'upcoming' ? (
                <button
                  onClick={() => {
                    setMealForm({ planned_date: '', meal_type: 'dinner', recipe_name: '', notes: '', ingredients: '', instructions: '' })
                    setShowAddMeal(true)
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-900 transition-colors"
                  style={{ background: '#fbbf24' }}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Meal
                </button>
              ) : (
                <button
                  onClick={() => {
                    setRecipeForm({ recipe_name: '', notes: '', ingredients: '', instructions: '' })
                    setShowAddRecipe(true)
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-900 transition-colors"
                  style={{ background: '#fbbf24' }}
                >
                  <Plus className="w-3.5 h-3.5" /> Save Recipe
                </button>
              )}
            </div>

            {mealPlansView === 'upcoming' ? (
              mealPlans.length === 0 ? (
                <div className="rounded-lg border border-dashed border-stone-700 p-8 text-center text-stone-400">
                  No meals planned yet. Add one, or ask the assistant to suggest something.
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedMealPlans).map(([date, meals]) => (
                    <div key={date}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-stone-300">
                          {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {meals.map(meal => (
                          <div
                            key={meal.id}
                            onClick={() => setViewingMeal(meal)}
                            className="flex items-center justify-between rounded-lg bg-stone-800/50 border border-stone-700 px-4 py-3 group hover:bg-stone-800 transition-colors cursor-pointer"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-stone-50">{MEAL_TYPE_ICONS[meal.meal_type] || '🍽️'} {meal.recipe_name}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-stone-400">
                                <span className="capitalize">{meal.meal_type}</span>
                                {meal.notes && <><span>•</span><span>{meal.notes}</span></>}
                                {(meal.ingredients?.length || meal.instructions) && <><span>•</span><span className="text-yellow-500">Recipe available</span></>}
                              </div>
                            </div>
                            <button
                              onClick={e => { e.stopPropagation(); deleteMealPlan(meal.id) }}
                              className="p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-stone-700 rounded transition-all"
                            >
                              <Trash2 className="w-4 h-4 text-stone-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              savedRecipes.length === 0 ? (
                <div className="rounded-lg border border-dashed border-stone-700 p-8 text-center text-stone-400">
                  No saved recipes yet. Save a meal you like to come back to it later.
                </div>
              ) : (
                <div className="space-y-2">
                  {savedRecipes.map(recipe => (
                    <div
                      key={recipe.id}
                      onClick={() => setViewingRecipe(recipe)}
                      className="flex items-center justify-between rounded-lg bg-stone-800/50 border border-stone-700 px-4 py-3 group hover:bg-stone-800 transition-colors cursor-pointer"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-stone-50">🍽️ {recipe.recipe_name}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-stone-400">
                          {recipe.notes && <span>{recipe.notes}</span>}
                          {(recipe.ingredients?.length || recipe.instructions) && <span className="text-yellow-500">Recipe available</span>}
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); openPlanRecipe(recipe) }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-900 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        style={{ background: '#fbbf24' }}
                      >
                        Plan this
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </>
      ) : activeTab === 'pantry' ? (
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
                                onClick={() => openEditItem(item)}
                                title="Edit"
                                className="p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-stone-700 rounded transition-all"
                              >
                                <Pencil className="w-4 h-4 text-stone-400" />
                              </button>
                              <button
                                onClick={() => updateItem(item.id, { quantity: 0 })}
                                title="Remove from pantry (moves to Shopping)"
                                className="p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-amber-500/10 rounded transition-all"
                              >
                                <ShoppingCart className="w-4 h-4 text-amber-400" />
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
            <h2 className="text-lg font-semibold text-stone-50 mb-4">Shopping List</h2>
            {filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed border-stone-700 p-8 text-center text-stone-400">
                Nothing to restock right now
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
                        const isEmpty = item.quantity != null && item.quantity <= 0
                        return (
                          <div key={item.id} className="flex items-center justify-between rounded-lg bg-stone-800/50 border border-stone-700 px-4 py-3 group hover:bg-stone-800 transition-colors">
                            <div className="flex-1">
                              <p className="font-medium text-stone-50">{item.name}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-stone-400">
                                {item.category && <span>{item.category}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isEmpty ? (
                                <span className="text-xs px-2 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 whitespace-nowrap">
                                  Empty
                                </span>
                              ) : item.expiration_date ? (
                                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${expirationBadgeClasses[status]}`}>
                                  {formatExpirationLabel(item.expiration_date)}
                                </span>
                              ) : null}
                              <button
                                onClick={() => openRestock(item)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-900 transition-colors"
                                style={{ background: '#fbbf24' }}
                              >
                                <PackagePlus className="w-3.5 h-3.5" /> Restocked
                              </button>
                              <button
                                onClick={() => openEditItem(item)}
                                title="Edit"
                                className="p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-stone-700 rounded transition-all"
                              >
                                <Pencil className="w-4 h-4 text-stone-400" />
                              </button>
                              <button
                                onClick={() => deleteItem(item.id)}
                                className="p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-stone-700 rounded transition-all"
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


      {/* Add Item Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-stone-900 w-full sm:max-w-md sm:rounded-2xl max-h-screen overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-stone-900 border-b border-stone-700 px-6 py-4 flex items-center gap-3">
              <button onClick={closeItemModal} className="p-1 hover:bg-stone-800 rounded">
                <ArrowLeft className="w-5 h-5 text-stone-50" />
              </button>
              <h1 className="text-lg font-semibold text-stone-50">{editingItem ? 'Edit Item' : 'Add Item'}</h1>
            </div>

            {/* Barcode scanner */}
            {!editingItem && (
              <div className="px-6 pt-4">
                <button className="w-full py-3 rounded-lg border-2 border-dashed border-yellow-500 text-yellow-500 font-medium hover:bg-yellow-500/10 transition-colors flex items-center justify-center gap-2">
                  <Barcode className="w-5 h-5" />
                  Scan Barcode
                </button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={submitItem} className="flex-1 px-6 py-4 space-y-4">
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
                  {editingItem ? 'Save Changes' : 'Add to Pantry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restocking && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50">
          <div className="bg-stone-900 w-full sm:max-w-md sm:rounded-2xl max-h-screen overflow-y-auto flex flex-col">
            <div className="sticky top-0 bg-stone-900 border-b border-stone-700 px-6 py-4 flex items-center gap-3">
              <button onClick={() => setRestocking(null)} className="p-1 hover:bg-stone-800 rounded">
                <ArrowLeft className="w-5 h-5 text-stone-50" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-stone-50">{restocking.name}</h1>
                <p className="text-xs text-stone-400">Update details to return to pantry</p>
              </div>
            </div>
            <form onSubmit={submitRestock} className="px-6 py-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-stone-300 mb-2 block">New Quantity *</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setRestockForm(p => ({ ...p, quantity: String(Math.max(1, parseFloat(p.quantity) - 1)) }))}
                    className="w-10 h-10 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-50 font-semibold transition-colors">−</button>
                  <input type="number" min="0.1" step="0.1" required value={restockForm.quantity}
                    onChange={e => setRestockForm(p => ({ ...p, quantity: e.target.value }))}
                    className="flex-1 rounded-lg border border-stone-600 bg-stone-800 px-4 py-2 text-center text-stone-50 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                  <button type="button" onClick={() => setRestockForm(p => ({ ...p, quantity: String(parseFloat(p.quantity) + 1) }))}
                    className="w-10 h-10 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-stone-900 font-semibold transition-colors">+</button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-stone-300 mb-2 block">New Expiration Date</label>
                <input type="date" value={restockForm.expiration_date}
                  onChange={e => setRestockForm(p => ({ ...p, expiration_date: e.target.value }))}
                  className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-3 text-stone-50 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-300 mb-2 block">Store</label>
                <select value={restockForm.store} onChange={e => setRestockForm(p => ({ ...p, store: e.target.value }))}
                  className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-3 text-stone-50 focus:outline-none focus:ring-2 focus:ring-yellow-500">
                  <option value="">Same as before ({restocking.store ?? 'No store'})</option>
                  {STORES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-stone-300 mb-2 block">Price ($)</label>
                <input type="number" step="0.01" placeholder={restocking.price?.toFixed(2) ?? '0.00'} value={restockForm.price}
                  onChange={e => setRestockForm(p => ({ ...p, price: e.target.value }))}
                  className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-3 text-stone-50 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full py-3 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-stone-900 font-semibold transition-colors">
                  Back to Pantry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Meal Modal */}
      {showAddMeal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-stone-900 w-full sm:max-w-md sm:rounded-2xl max-h-screen overflow-y-auto flex flex-col">
            <div className="sticky top-0 bg-stone-900 border-b border-stone-700 px-6 py-4 flex items-center gap-3">
              <button onClick={() => setShowAddMeal(false)} className="p-1 hover:bg-stone-800 rounded">
                <ArrowLeft className="w-5 h-5 text-stone-50" />
              </button>
              <h1 className="text-lg font-semibold text-stone-50">Add Meal</h1>
            </div>
            <form onSubmit={addMealPlan} className="flex-1 px-6 py-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-stone-300 mb-2 block">Date *</label>
                <input
                  type="date"
                  required
                  value={mealForm.planned_date}
                  onChange={e => setMealForm(p => ({ ...p, planned_date: e.target.value }))}
                  className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-3 text-stone-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-300 mb-2 block">Meal</label>
                <select
                  value={mealForm.meal_type}
                  onChange={e => setMealForm(p => ({ ...p, meal_type: e.target.value as MealPlan['meal_type'] }))}
                  className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-3 text-stone-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  {MEAL_TYPES.map(t => (
                    <option key={t} value={t}>{MEAL_TYPE_ICONS[t]} {t[0].toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-stone-300 mb-2 block">Recipe *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chicken Stir Fry"
                  value={mealForm.recipe_name}
                  onChange={e => setMealForm(p => ({ ...p, recipe_name: e.target.value }))}
                  className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-3 text-stone-50 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-300 mb-2 block">Notes (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Use up the broccoli"
                  value={mealForm.notes}
                  onChange={e => setMealForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-3 text-stone-50 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-300 mb-2 block">Ingredients (optional, one per line)</label>
                <textarea
                  rows={4}
                  placeholder={'2 chicken breasts\n1/4 cup teriyaki sauce\n2 cups rice'}
                  value={mealForm.ingredients}
                  onChange={e => setMealForm(p => ({ ...p, ingredients: e.target.value }))}
                  className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-3 text-stone-50 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-300 mb-2 block">Instructions (optional)</label>
                <textarea
                  rows={4}
                  placeholder="1. Cook rice. 2. Sear chicken. 3. Toss with sauce…"
                  value={mealForm.instructions}
                  onChange={e => setMealForm(p => ({ ...p, instructions: e.target.value }))}
                  className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-3 text-stone-50 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-stone-900 font-semibold transition-colors"
                >
                  Add to Meal Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recipe Detail Modal */}
      {viewingMeal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-stone-900 w-full sm:max-w-md sm:rounded-2xl max-h-screen overflow-y-auto flex flex-col">
            <div className="sticky top-0 bg-stone-900 border-b border-stone-700 px-6 py-4 flex items-center gap-3">
              <button onClick={() => { setViewingMeal(null); setEditingMeal(false) }} className="p-1 hover:bg-stone-800 rounded">
                <ArrowLeft className="w-5 h-5 text-stone-50" />
              </button>
              <div className="flex-1">
                <h1 className="text-lg font-semibold text-stone-50">
                  {editingMeal ? 'Edit Meal' : `${MEAL_TYPE_ICONS[viewingMeal.meal_type] || '🍽️'} ${viewingMeal.recipe_name}`}
                </h1>
                {!editingMeal && (
                  <p className="text-xs text-stone-400 capitalize">
                    {viewingMeal.meal_type} • {new Date(viewingMeal.planned_date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>
              {!editingMeal && (
                <button onClick={() => openEditMeal(viewingMeal)} title="Edit" className="p-2 hover:bg-stone-800 rounded">
                  <Pencil className="w-4 h-4 text-stone-400" />
                </button>
              )}
            </div>

            {editingMeal ? (
              <form onSubmit={submitEditMeal} className="px-6 py-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-stone-300 mb-2 block">Date *</label>
                  <input
                    type="date"
                    required
                    value={mealForm.planned_date}
                    onChange={e => setMealForm(p => ({ ...p, planned_date: e.target.value }))}
                    className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-3 text-stone-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-300 mb-2 block">Meal</label>
                  <select
                    value={mealForm.meal_type}
                    onChange={e => setMealForm(p => ({ ...p, meal_type: e.target.value as MealPlan['meal_type'] }))}
                    className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-3 text-stone-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    {MEAL_TYPES.map(t => (
                      <option key={t} value={t}>{MEAL_TYPE_ICONS[t]} {t[0].toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-300 mb-2 block">Recipe *</label>
                  <input
                    type="text"
                    required
                    value={mealForm.recipe_name}
                    onChange={e => setMealForm(p => ({ ...p, recipe_name: e.target.value }))}
                    className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-3 text-stone-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-300 mb-2 block">Notes (optional)</label>
                  <input
                    type="text"
                    value={mealForm.notes}
                    onChange={e => setMealForm(p => ({ ...p, notes: e.target.value }))}
                    className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-3 text-stone-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-300 mb-2 block">Ingredients (one per line)</label>
                  <textarea
                    rows={5}
                    placeholder={'2 chicken breasts\n1/4 cup teriyaki sauce\n2 cups rice'}
                    value={mealForm.ingredients}
                    onChange={e => setMealForm(p => ({ ...p, ingredients: e.target.value }))}
                    className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-3 text-stone-50 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-300 mb-2 block">Instructions</label>
                  <textarea
                    rows={5}
                    placeholder="1. Cook rice. 2. Sear chicken. 3. Toss with sauce…"
                    value={mealForm.instructions}
                    onChange={e => setMealForm(p => ({ ...p, instructions: e.target.value }))}
                    className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-3 text-stone-50 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingMeal(false)}
                    className="flex-1 py-3 rounded-lg border border-stone-700 text-stone-300 hover:bg-stone-800 font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-stone-900 font-semibold transition-colors"
                  >
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <div className="px-6 py-4 space-y-5">
                {viewingMeal.notes && (
                  <p className="text-sm text-stone-300">{viewingMeal.notes}</p>
                )}
                <div>
                  <h2 className="text-sm font-semibold text-stone-50 mb-2">Ingredients</h2>
                  {viewingMeal.ingredients && viewingMeal.ingredients.length > 0 ? (
                    <ul className="space-y-1.5">
                      {viewingMeal.ingredients.map((ing, i) => (
                        <li key={i} className="text-sm text-stone-300 flex items-start gap-2">
                          <span className="text-yellow-500 mt-0.5">•</span>
                          <span>{ing}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-stone-400">No ingredient list yet — tap the pencil to add one, or ask the Meal Assistant to fill this in.</p>
                  )}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-stone-50 mb-2">Instructions</h2>
                  {viewingMeal.instructions ? (
                    <p className="text-sm text-stone-300 whitespace-pre-wrap">{viewingMeal.instructions}</p>
                  ) : (
                    <p className="text-sm text-stone-400">No instructions yet — tap the pencil to add some, or ask the Meal Assistant to fill this in.</p>
                  )}
                </div>
                <button
                  onClick={() => saveMealAsRecipe(viewingMeal)}
                  className="w-full py-3 rounded-lg border border-stone-700 text-yellow-500 hover:bg-stone-800 font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Heart className="w-4 h-4" /> Save Recipe for Later
                </button>
                <button
                  onClick={() => { deleteMealPlan(viewingMeal.id); setViewingMeal(null) }}
                  className="w-full py-3 rounded-lg border border-stone-700 text-stone-400 hover:bg-stone-800 hover:text-stone-200 font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Remove from Meal Plan
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Saved Recipe Modal */}
      {showAddRecipe && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-stone-900 w-full sm:max-w-md sm:rounded-2xl max-h-screen overflow-y-auto flex flex-col">
            <div className="sticky top-0 bg-stone-900 border-b border-stone-700 px-6 py-4 flex items-center gap-3">
              <button onClick={() => setShowAddRecipe(false)} className="p-1 hover:bg-stone-800 rounded">
                <ArrowLeft className="w-5 h-5 text-stone-50" />
              </button>
              <h1 className="text-lg font-semibold text-stone-50">Save a Recipe</h1>
            </div>
            <form onSubmit={submitAddRecipe} className="flex-1 px-6 py-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-stone-300 mb-2 block">Recipe *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chicken Stir Fry"
                  value={recipeForm.recipe_name}
                  onChange={e => setRecipeForm(p => ({ ...p, recipe_name: e.target.value }))}
                  className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-3 text-stone-50 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-300 mb-2 block">Notes (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Everyone loved this one"
                  value={recipeForm.notes}
                  onChange={e => setRecipeForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-3 text-stone-50 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-300 mb-2 block">Ingredients (optional, one per line)</label>
                <textarea
                  rows={4}
                  placeholder={'2 chicken breasts\n1/4 cup teriyaki sauce\n2 cups rice'}
                  value={recipeForm.ingredients}
                  onChange={e => setRecipeForm(p => ({ ...p, ingredients: e.target.value }))}
                  className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-3 text-stone-50 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-300 mb-2 block">Instructions (optional)</label>
                <textarea
                  rows={4}
                  placeholder="1. Cook rice. 2. Sear chicken. 3. Toss with sauce…"
                  value={recipeForm.instructions}
                  onChange={e => setRecipeForm(p => ({ ...p, instructions: e.target.value }))}
                  className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-3 text-stone-50 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-stone-900 font-semibold transition-colors"
                >
                  Save Recipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Saved Recipe Detail Modal */}
      {viewingRecipe && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-stone-900 w-full sm:max-w-md sm:rounded-2xl max-h-screen overflow-y-auto flex flex-col">
            <div className="sticky top-0 bg-stone-900 border-b border-stone-700 px-6 py-4 flex items-center gap-3">
              <button onClick={() => setViewingRecipe(null)} className="p-1 hover:bg-stone-800 rounded">
                <ArrowLeft className="w-5 h-5 text-stone-50" />
              </button>
              <h1 className="text-lg font-semibold text-stone-50 flex-1">🍽️ {viewingRecipe.recipe_name}</h1>
            </div>
            <div className="px-6 py-4 space-y-5">
              {viewingRecipe.notes && <p className="text-sm text-stone-300">{viewingRecipe.notes}</p>}
              <div>
                <h2 className="text-sm font-semibold text-stone-50 mb-2">Ingredients</h2>
                {viewingRecipe.ingredients && viewingRecipe.ingredients.length > 0 ? (
                  <ul className="space-y-1.5">
                    {viewingRecipe.ingredients.map((ing, i) => (
                      <li key={i} className="text-sm text-stone-300 flex items-start gap-2">
                        <span className="text-yellow-500 mt-0.5">•</span>
                        <span>{ing}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-stone-400">No ingredient list saved.</p>
                )}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-stone-50 mb-2">Instructions</h2>
                {viewingRecipe.instructions ? (
                  <p className="text-sm text-stone-300 whitespace-pre-wrap">{viewingRecipe.instructions}</p>
                ) : (
                  <p className="text-sm text-stone-400">No instructions saved.</p>
                )}
              </div>
              <button
                onClick={() => { openPlanRecipe(viewingRecipe); setViewingRecipe(null) }}
                className="w-full py-3 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-stone-900 font-semibold transition-colors"
              >
                Plan This Meal
              </button>
              <button
                onClick={() => deleteRecipe(viewingRecipe.id)}
                className="w-full py-3 rounded-lg border border-stone-700 text-stone-400 hover:bg-stone-800 hover:text-stone-200 font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Remove Saved Recipe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Recipe Modal */}
      {planningRecipe && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-stone-900 w-full sm:max-w-md sm:rounded-2xl max-h-screen overflow-y-auto flex flex-col">
            <div className="sticky top-0 bg-stone-900 border-b border-stone-700 px-6 py-4 flex items-center gap-3">
              <button onClick={() => setPlanningRecipe(null)} className="p-1 hover:bg-stone-800 rounded">
                <ArrowLeft className="w-5 h-5 text-stone-50" />
              </button>
              <h1 className="text-lg font-semibold text-stone-50">Plan &quot;{planningRecipe.recipe_name}&quot;</h1>
            </div>
            <form onSubmit={submitPlanRecipe} className="flex-1 px-6 py-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-stone-300 mb-2 block">Date *</label>
                <input
                  type="date"
                  required
                  value={planForm.planned_date}
                  onChange={e => setPlanForm(p => ({ ...p, planned_date: e.target.value }))}
                  className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-3 text-stone-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-300 mb-2 block">Meal</label>
                <select
                  value={planForm.meal_type}
                  onChange={e => setPlanForm(p => ({ ...p, meal_type: e.target.value as MealPlan['meal_type'] }))}
                  className="w-full rounded-lg border border-stone-600 bg-stone-800 px-4 py-3 text-stone-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  {MEAL_TYPES.map(t => (
                    <option key={t} value={t}>{MEAL_TYPE_ICONS[t]} {t[0].toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-stone-900 font-semibold transition-colors"
                >
                  Add to Meal Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>

      {householdId && (
        <PantryAssistant householdId={householdId} activeTab={activeTab} onDataChanged={load} />
      )}
    </ModulePage>
  )
}
