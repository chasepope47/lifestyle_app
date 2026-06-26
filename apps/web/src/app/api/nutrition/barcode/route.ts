import { NextResponse } from 'next/server'

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1'

// USDA nutrient IDs
const N = { calories: 1008, protein: 1003, carbs: 1005, fat: 1004, fiber: 1079, sodium: 1093 }

function get(nutrients: { nutrientId: number; value: number }[], id: number) {
  return nutrients.find(n => n.nutrientId === id)?.value ?? 0
}

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get('code')?.trim()
  if (!code) return NextResponse.json({ error: 'No barcode provided' }, { status: 400 })

  const apiKey = process.env.NEXT_PUBLIC_USDA_API_KEY ?? 'DEMO_KEY'

  // UPC-A is 12 digits — pad if scanner dropped a leading zero
  const padded = code.padStart(12, '0')
  const stripped = code.replace(/^0+/, '')

  // ── 1. Try USDA Branded Foods (fastest, already configured) ──
  try {
    const url = new URL(`${USDA_BASE}/foods/search`)
    url.searchParams.set('query', code)
    url.searchParams.set('dataType', 'Branded')
    url.searchParams.set('pageSize', '25')
    url.searchParams.set('api_key', apiKey)

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) })
    if (res.ok) {
      const data = await res.json() as { foods?: { fdcId: number; description: string; brandOwner?: string; gtinUpc?: string; foodNutrients: { nutrientId: number; value: number }[] }[] }
      const foods = data.foods ?? []

      const match = foods.find(f =>
        f.gtinUpc === code ||
        f.gtinUpc === padded ||
        (f.gtinUpc && f.gtinUpc.replace(/^0+/, '') === stripped)
      )

      if (match) {
        return NextResponse.json({
          fdcId: match.fdcId,
          description: match.description,
          brandOwner: match.brandOwner ?? null,
          calories: get(match.foodNutrients, N.calories),
          protein_g: get(match.foodNutrients, N.protein),
          carbs_g: get(match.foodNutrients, N.carbs),
          fat_g: get(match.foodNutrients, N.fat),
          fiber_g: get(match.foodNutrients, N.fiber),
          sodium_mg: get(match.foodNutrients, N.sodium),
        })
      }
    }
  } catch {
    // Fall through to Open Food Facts
  }

  // ── 2. Fall back to Open Food Facts (server-side — no CORS or timeout issues) ──
  for (const barcode of [code, padded]) {
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
        {
          headers: { 'User-Agent': 'LifestyleApp/1.0 (https://lifestyle-app-web.vercel.app)' },
          signal: AbortSignal.timeout(8000),
        }
      )
      if (!res.ok) continue
      const data = await res.json() as { status: number; product?: Record<string, unknown> & { nutriments?: Record<string, number> } }
      if (data.status !== 1 || !data.product) continue

      const p = data.product
      const nm = p.nutriments ?? {}
      return NextResponse.json({
        fdcId: parseInt(code) || 0,
        description: (p.product_name as string) || (p.product_name_en as string) || 'Unknown product',
        brandOwner: (p.brands as string) || null,
        calories: nm['energy-kcal_100g'] ?? nm['energy-kcal'] ?? 0,
        protein_g: nm['proteins_100g'] ?? nm['proteins'] ?? 0,
        carbs_g: nm['carbohydrates_100g'] ?? nm['carbohydrates'] ?? 0,
        fat_g: nm['fat_100g'] ?? nm['fat'] ?? 0,
        fiber_g: nm['fiber_100g'] ?? nm['fiber'] ?? 0,
        sodium_mg: (nm['sodium_100g'] ?? nm['sodium'] ?? 0) * 1000,
      })
    } catch {
      continue
    }
  }

  return NextResponse.json({ error: 'Product not found' }, { status: 404 })
}
