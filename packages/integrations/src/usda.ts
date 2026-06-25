// USDA FoodData Central API — free, no auth required for basic search
// Docs: https://fdc.nal.usda.gov/api-guide.html

const BASE_URL = 'https://api.nal.usda.gov/fdc/v1'

export interface UsdaFoodItem {
  fdcId: number
  description: string
  brandOwner?: string
  ingredients?: string
  foodNutrients: UsdaNutrient[]
}

export interface UsdaNutrient {
  nutrientId: number
  nutrientName: string
  unitName: string
  value: number
}

export interface FoodSearchResult {
  fdcId: number
  description: string
  brandOwner?: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  sodium_mg: number
}

// USDA nutrient IDs
const NUTRIENT_IDS = {
  calories: 1008,
  protein: 1003,
  carbs: 1005,
  fat: 1004,
  fiber: 1079,
  sodium: 1093,
}

function extractNutrient(nutrients: UsdaNutrient[], id: number): number {
  return nutrients.find(n => n.nutrientId === id)?.value ?? 0
}

function mapToSearchResult(item: UsdaFoodItem): FoodSearchResult {
  const n = item.foodNutrients
  return {
    fdcId: item.fdcId,
    description: item.description,
    brandOwner: item.brandOwner,
    calories: extractNutrient(n, NUTRIENT_IDS.calories),
    protein_g: extractNutrient(n, NUTRIENT_IDS.protein),
    carbs_g: extractNutrient(n, NUTRIENT_IDS.carbs),
    fat_g: extractNutrient(n, NUTRIENT_IDS.fat),
    fiber_g: extractNutrient(n, NUTRIENT_IDS.fiber),
    sodium_mg: extractNutrient(n, NUTRIENT_IDS.sodium),
  }
}

export async function searchFoods(query: string, apiKey = 'DEMO_KEY'): Promise<FoodSearchResult[]> {
  const url = new URL(`${BASE_URL}/foods/search`)
  url.searchParams.set('query', query)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('pageSize', '20')
  url.searchParams.set('dataType', 'Branded,Foundation,SR Legacy')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`USDA API error: ${res.status}`)

  const json = await res.json() as { foods?: UsdaFoodItem[] }
  return (json.foods ?? []).map(mapToSearchResult)
}

export async function getFoodDetail(fdcId: number, apiKey = 'DEMO_KEY'): Promise<FoodSearchResult | null> {
  const url = new URL(`${BASE_URL}/food/${fdcId}`)
  url.searchParams.set('api_key', apiKey)

  const res = await fetch(url.toString())
  if (!res.ok) return null

  const item = await res.json() as UsdaFoodItem
  return mapToSearchResult(item)
}
