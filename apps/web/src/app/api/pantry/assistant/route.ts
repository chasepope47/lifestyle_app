import { GoogleGenAI, type Content } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { READ_TOOLS, WRITE_TOOLS, WRITE_TOOL_NAMES } from './_lib/tools'
import { executeReadTool } from './_lib/readTools'

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite'
const MAX_TOOL_TURNS = 6

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')
  return new GoogleGenAI({ apiKey })
}

function systemPrompt(todayISO: string, activeTab: string) {
  const tabNote =
    activeTab === 'shopping'
      ? "The user is currently viewing the Shopping tab — they're looking at items that are empty or expiring soon."
      : activeTab === 'mealplans'
        ? "The user is currently viewing the Meal Plans tab."
        : "The user is currently viewing the Pantry tab — they're looking at items currently on hand."

  return `You are a helpful meal-planning assistant embedded in a couples' household pantry app.

Today's date is ${todayISO}. ${tabNote}

Database notes:
- get_pantry_items takes a status filter: 'active' (on hand and cookable — not empty, not expired/critical), 'needs_restock' (empty, or expired/critical/soon), or 'all'. When the user asks what they can cook, or asks for meal ideas without specifying, default status to 'active' if they're on the Pantry or Meal Plans tab, or 'needs_restock' if they're on the Shopping tab — but always defer to what they explicitly ask for.
- meal_plans.meal_type must be one of: breakfast, lunch, dinner, snack.
- Every meal you propose with create_meal_plan should include the full recipe: a complete ingredients list (with quantities) and step-by-step instructions, not just a name — the user opens the planned meal to see exactly what to buy and do.

Tool use rules:
- Read tools (get_pantry_items, get_meal_plans) are safe — call as many as you need to answer the user's question accurately, e.g. check what's on hand before suggesting a recipe.
- Write tools (create_meal_plan, update_meal_plan, delete_meal_plan) are NEVER executed automatically. When you call one, the app shows the user a confirmation card and only writes if they approve. Because of this: call AT MOST ONE write tool per response, briefly state in your text what you're proposing and why, then stop — do not call further tools after a write tool in the same turn.
- Keep responses concise and conversational; this is a chat widget, not a report.`
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const householdId: string | undefined = body.householdId
    const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : []
    const activeTab: string = typeof body.activeTab === 'string' ? body.activeTab : 'pantry'

    if (!householdId || messages.length === 0) {
      return NextResponse.json({ error: 'Missing householdId or messages' }, { status: 400 })
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

    const ai = getGeminiClient()
    const config = {
      systemInstruction: systemPrompt(new Date().toISOString().slice(0, 10), activeTab),
      tools: [{ functionDeclarations: [...READ_TOOLS, ...WRITE_TOOLS] }],
    }

    const contents: Content[] = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    let pendingAction: { tool: string; input: Record<string, unknown> } | null = null
    let finalText = ''

    for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
      const result = await ai.models.generateContent({ model: MODEL, contents, config })

      const text = result.text?.trim()
      if (text) finalText = text

      const functionCalls = result.functionCalls ?? []
      const writeCall = functionCalls.find(fc => fc.name && WRITE_TOOL_NAMES.has(fc.name))
      if (writeCall) {
        pendingAction = { tool: writeCall.name!, input: (writeCall.args ?? {}) as Record<string, unknown> }
        break
      }

      if (functionCalls.length === 0) break

      const modelParts = result.candidates?.[0]?.content?.parts ?? []
      contents.push({ role: 'model', parts: modelParts })

      const fnResponses = await Promise.all(
        functionCalls.map(async fc => {
          const res = await executeReadTool(supabase, householdId, fc.name!, (fc.args ?? {}) as Record<string, unknown>)
          return { functionResponse: { name: fc.name!, response: res as Record<string, unknown>, id: fc.id } }
        })
      )
      contents.push({ role: 'user', parts: fnResponses })
    }

    if (!finalText) {
      finalText = pendingAction
        ? `I'd like to ${pendingAction.tool.replace(/_/g, ' ')} — please review and approve below.`
        : "I wasn't able to come up with a response — could you rephrase that?"
    }

    return NextResponse.json({ message: finalText, pendingAction })
  } catch (error) {
    console.error('Pantry assistant error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Assistant request failed' },
      { status: 500 }
    )
  }
}
