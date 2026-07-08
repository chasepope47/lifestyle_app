import { GoogleGenerativeAI, type Content, type Part } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { READ_TOOLS, WRITE_TOOLS, WRITE_TOOL_NAMES } from './_lib/tools'
import { executeReadTool } from './_lib/readTools'

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite'
const MAX_TOOL_TURNS = 6

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')
  return new GoogleGenerativeAI(apiKey)
}

function systemPrompt(todayISO: string) {
  return `You are a helpful budgeting assistant embedded in a couples' household budget app.

Today's date is ${todayISO}.

Database notes:
- transactions.category is a LEGACY text field constrained by a database CHECK to only allow 'needs', 'wants', 'savings', 'transfers', or null. NEVER write any other value to it, and leave it unset for new/edited transactions.
- Categorize transactions using category_id instead — a reference to the household's custom "envelope" categories (from get_categories / create_category). Look up or create the right envelope category before categorizing a transaction.
- transactions.amount is negative for an expense, positive for income.
- A transaction requires a valid account_id; call get_accounts first if you don't already know one.

Tool use rules:
- Read tools (get_transactions, get_categories, get_goals, get_accounts, get_summary) are safe — call as many as you need to answer the user's question accurately.
- Write tools (create/update/delete on transactions, categories, goals) are NEVER executed automatically. When you call one, the app shows the user a confirmation card and only writes if they approve. Because of this: call AT MOST ONE write tool per response, briefly state in your text what you're proposing and why, then stop — do not call further tools after a write tool in the same turn.
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

    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: systemPrompt(new Date().toISOString().slice(0, 10)),
      tools: [{ functionDeclarations: [...READ_TOOLS, ...WRITE_TOOLS] }],
    })

    const contents: Content[] = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    let pendingAction: { tool: string; input: Record<string, unknown> } | null = null
    let finalText = ''

    for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
      const result = await model.generateContent({ contents })
      const parts = result.response.candidates?.[0]?.content?.parts ?? []

      const textParts = parts.filter((p): p is { text: string } => 'text' in p && typeof p.text === 'string')
      const text = textParts.map(p => p.text).join('').trim()
      if (text) finalText = text

      const fnCallParts = parts.filter(
        (p): p is { functionCall: { name: string; args: Record<string, unknown> } } =>
          'functionCall' in p && p.functionCall != null
      )

      const writeCall = fnCallParts.find(p => WRITE_TOOL_NAMES.has(p.functionCall.name))
      if (writeCall) {
        pendingAction = { tool: writeCall.functionCall.name, input: writeCall.functionCall.args }
        break
      }

      if (fnCallParts.length === 0) break

      contents.push({ role: 'model', parts })

      const fnResponses = await Promise.all(
        fnCallParts.map(async p => {
          const res = await executeReadTool(supabase, householdId, p.functionCall.name, p.functionCall.args)
          return { functionResponse: { name: p.functionCall.name, response: res } }
        })
      )
      contents.push({ role: 'user', parts: fnResponses as Part[] })
    }

    if (!finalText) {
      finalText = pendingAction
        ? `I'd like to ${pendingAction.tool.replace(/_/g, ' ')} — please review and approve below.`
        : "I wasn't able to come up with a response — could you rephrase that?"
    }

    return NextResponse.json({ message: finalText, pendingAction })
  } catch (error) {
    console.error('Budget assistant error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Assistant request failed' },
      { status: 500 }
    )
  }
}
