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
      case 'create_transaction': {
        const parsed = writeToolSchemas.create_transaction.safeParse(rawInput)
        if (!parsed.success) return NextResponse.json({ error: `Invalid input: ${parsed.error.message}` }, { status: 400 })
        const c = parsed.data
        const { data, error } = await supabase
          .from('transactions')
          .insert({
            household_id: householdId,
            user_id: user.id,
            account_id: c.account_id,
            amount: c.amount,
            description: c.description,
            merchant: c.merchant,
            transaction_date: c.transaction_date ?? new Date().toISOString().slice(0, 10),
            category_id: c.category_id,
            notes: c.notes,
          })
          .select()
          .single()
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ result: data })
      }

      case 'update_transaction': {
        const parsed = writeToolSchemas.update_transaction.safeParse(rawInput)
        if (!parsed.success) return NextResponse.json({ error: `Invalid input: ${parsed.error.message}` }, { status: 400 })
        const { id, ...fields } = parsed.data
        const { data, error } = await supabase
          .from('transactions')
          .update(fields)
          .eq('id', id)
          .eq('household_id', householdId)
          .select()
          .single()
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ result: data })
      }

      case 'delete_transaction': {
        const parsed = writeToolSchemas.delete_transaction.safeParse(rawInput)
        if (!parsed.success) return NextResponse.json({ error: `Invalid input: ${parsed.error.message}` }, { status: 400 })
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', parsed.data.id)
          .eq('household_id', householdId)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ result: { id: parsed.data.id, deleted: true } })
      }

      case 'create_category': {
        const parsed = writeToolSchemas.create_category.safeParse(rawInput)
        if (!parsed.success) return NextResponse.json({ error: `Invalid input: ${parsed.error.message}` }, { status: 400 })
        const c = parsed.data
        const { data, error } = await supabase
          .from('budget_categories')
          .insert({
            household_id: householdId,
            name: c.name,
            monthly_limit: c.monthly_limit,
            color: c.color,
            icon: c.icon,
          })
          .select()
          .single()
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ result: data })
      }

      case 'update_category': {
        const parsed = writeToolSchemas.update_category.safeParse(rawInput)
        if (!parsed.success) return NextResponse.json({ error: `Invalid input: ${parsed.error.message}` }, { status: 400 })
        const { id, ...fields } = parsed.data
        const { data, error } = await supabase
          .from('budget_categories')
          .update(fields)
          .eq('id', id)
          .eq('household_id', householdId)
          .select()
          .single()
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ result: data })
      }

      case 'delete_category': {
        const parsed = writeToolSchemas.delete_category.safeParse(rawInput)
        if (!parsed.success) return NextResponse.json({ error: `Invalid input: ${parsed.error.message}` }, { status: 400 })
        const { error } = await supabase
          .from('budget_categories')
          .delete()
          .eq('id', parsed.data.id)
          .eq('household_id', householdId)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ result: { id: parsed.data.id, deleted: true } })
      }

      case 'create_goal': {
        const parsed = writeToolSchemas.create_goal.safeParse(rawInput)
        if (!parsed.success) return NextResponse.json({ error: `Invalid input: ${parsed.error.message}` }, { status: 400 })
        const c = parsed.data
        const { data, error } = await supabase
          .from('budget_goals')
          .insert({
            household_id: householdId,
            created_by: user.id,
            name: c.name,
            goal_type: c.goal_type,
            target_amount: c.target_amount,
            category_id: c.category_id,
            target_date: c.target_date,
            notes: c.notes,
          })
          .select()
          .single()
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ result: data })
      }

      case 'update_goal': {
        const parsed = writeToolSchemas.update_goal.safeParse(rawInput)
        if (!parsed.success) return NextResponse.json({ error: `Invalid input: ${parsed.error.message}` }, { status: 400 })
        const { id, ...fields } = parsed.data
        const { data, error } = await supabase
          .from('budget_goals')
          .update(fields)
          .eq('id', id)
          .eq('household_id', householdId)
          .select()
          .single()
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ result: data })
      }

      case 'delete_goal': {
        const parsed = writeToolSchemas.delete_goal.safeParse(rawInput)
        if (!parsed.success) return NextResponse.json({ error: `Invalid input: ${parsed.error.message}` }, { status: 400 })
        const { error } = await supabase
          .from('budget_goals')
          .delete()
          .eq('id', parsed.data.id)
          .eq('household_id', householdId)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ result: { id: parsed.data.id, deleted: true } })
      }

      default:
        return NextResponse.json({ error: `Unknown or non-writable tool: ${tool}` }, { status: 400 })
    }
  } catch (error) {
    console.error('Budget assistant execute error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Execute request failed' },
      { status: 500 }
    )
  }
}
