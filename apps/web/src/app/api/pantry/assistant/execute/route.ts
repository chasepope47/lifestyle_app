import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { writeToolSchemas } from '../_lib/tools'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const householdId: string | undefined = body.householdId
    const tool: string | undefined = body.tool
    const rawInput = body.input

    if (!householdId || !tool) {
      return NextResponse.json({ error: 'Missing householdId or tool' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: membership } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .eq('household_id', householdId)
      .maybeSingle()
    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    switch (tool) {
      case 'create_meal_plan': {
        const parsed = writeToolSchemas.create_meal_plan.safeParse(rawInput)
        if (!parsed.success) return NextResponse.json({ error: `Invalid input: ${parsed.error.message}` }, { status: 400 })
        const c = parsed.data
        const { data, error } = await supabase
          .from('meal_plans')
          .insert({
            household_id: householdId,
            user_id: user.id,
            planned_date: c.planned_date,
            meal_type: c.meal_type,
            recipe_name: c.recipe_name,
            notes: c.notes,
            ingredients: c.ingredients,
            instructions: c.instructions,
          })
          .select()
          .single()
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ result: data })
      }

      case 'update_meal_plan': {
        const parsed = writeToolSchemas.update_meal_plan.safeParse(rawInput)
        if (!parsed.success) return NextResponse.json({ error: `Invalid input: ${parsed.error.message}` }, { status: 400 })
        const { id, ...fields } = parsed.data
        const { data, error } = await supabase
          .from('meal_plans')
          .update(fields)
          .eq('id', id)
          .eq('household_id', householdId)
          .select()
          .single()
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ result: data })
      }

      case 'delete_meal_plan': {
        const parsed = writeToolSchemas.delete_meal_plan.safeParse(rawInput)
        if (!parsed.success) return NextResponse.json({ error: `Invalid input: ${parsed.error.message}` }, { status: 400 })
        const { error } = await supabase
          .from('meal_plans')
          .delete()
          .eq('id', parsed.data.id)
          .eq('household_id', householdId)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ result: { id: parsed.data.id, deleted: true } })
      }

      case 'add_shopping_item': {
        const parsed = writeToolSchemas.add_shopping_item.safeParse(rawInput)
        if (!parsed.success) return NextResponse.json({ error: `Invalid input: ${parsed.error.message}` }, { status: 400 })
        const c = parsed.data
        const { data, error } = await supabase
          .from('pantry_items')
          .insert({
            household_id: householdId,
            user_id: user.id,
            name: c.name,
            category: c.category,
            store: c.store,
            quantity: 0,
          })
          .select()
          .single()
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ result: data })
      }

      default:
        return NextResponse.json({ error: `Unknown or non-writable tool: ${tool}` }, { status: 400 })
    }
  } catch (error) {
    console.error('Pantry assistant execute error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Execute request failed' },
      { status: 500 }
    )
  }
}
