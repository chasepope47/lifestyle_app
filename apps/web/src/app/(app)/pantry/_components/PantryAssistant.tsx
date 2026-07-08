'use client'
import { useState, useRef, useEffect } from 'react'
import { ChefHat, X, Send, Check, Loader2 } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface PendingAction {
  tool: string
  input: Record<string, unknown>
}

interface PantryAssistantProps {
  householdId: string
  activeTab: 'pantry' | 'shopping' | 'mealplans'
  onDataChanged: () => void
}

function shortId(id: unknown): string {
  return typeof id === 'string' ? id.slice(0, 8) : String(id)
}

function describeAction(action: PendingAction): string {
  const { tool, input } = action
  switch (tool) {
    case 'create_meal_plan': {
      const ingredientCount = Array.isArray(input.ingredients) ? input.ingredients.length : 0
      const recipeNote = ingredientCount > 0 ? ` — full recipe with ${ingredientCount} ingredients` : ''
      return `Add "${input.recipe_name}" for ${input.meal_type} on ${input.planned_date}${recipeNote}`
    }
    case 'update_meal_plan':
      return `Update meal plan ${shortId(input.id)}`
    case 'delete_meal_plan':
      return `Remove meal plan ${shortId(input.id)}`
    default:
      return tool.replace(/_/g, ' ')
  }
}

export function PantryAssistant({ householdId, activeTab, onDataChanged }: PantryAssistantProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, pendingActions, isLoading])

  const send = async () => {
    const text = input.trim()
    if (!text || isLoading) return
    setError(null)
    setPendingActions([])
    const nextMessages = [...messages, { role: 'user' as const, content: text }]
    setMessages(nextMessages)
    setInput('')
    setIsLoading(true)
    try {
      const res = await fetch('/api/pantry/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ householdId, activeTab, messages: nextMessages }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      if (Array.isArray(data.pendingActions) && data.pendingActions.length > 0) setPendingActions(data.pendingActions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const approveAll = async () => {
    if (pendingActions.length === 0 || isApplying) return
    setIsApplying(true)
    setError(null)
    try {
      for (const action of pendingActions) {
        const res = await fetch('/api/pantry/assistant/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ householdId, tool: action.tool, input: action.input }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to apply change')
      }
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: pendingActions.length > 1 ? `Done — applied ${pendingActions.length} changes.` : 'Done — applied that change.',
      }])
      setPendingActions([])
      onDataChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply change')
    } finally {
      setIsApplying(false)
    }
  }

  const rejectAll = () => {
    setMessages(prev => [...prev, { role: 'assistant', content: 'Cancelled — no changes made.' }])
    setPendingActions([])
  }

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95"
        style={{ background: 'linear-gradient(135deg, #d97706, #fbbf24)', boxShadow: '0 6px 20px rgba(217,119,6,0.45)' }}
        aria-label={open ? 'Close meal planning assistant' : 'Open meal planning assistant'}
      >
        {open ? <X className="w-6 h-6" /> : <ChefHat className="w-6 h-6" />}
      </button>

      {open && (
        <div className="fixed inset-x-3 bottom-[5.5rem] sm:inset-x-auto sm:bottom-24 sm:right-6 sm:w-96 z-40 flex flex-col rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl max-h-[70vh] overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Meal Assistant</h3>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 min-h-[200px]">
            {messages.length === 0 && (
              <p className="text-xs text-stone-400 dark:text-stone-500 text-center py-6">
                Ask what you can cook with what&apos;s on hand, or ask me to plan out meals for the week.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-amber-600 text-white rounded-br-sm'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-100 rounded-bl-sm'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {pendingActions.length > 0 && (
              <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3">
                <ul className="space-y-1.5 mb-2">
                  {pendingActions.map((action, i) => (
                    <li key={i} className="text-xs font-semibold text-amber-700 dark:text-amber-300">{describeAction(action)}</li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <button
                    onClick={approveAll}
                    disabled={isApplying}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold disabled:opacity-60 transition-colors"
                  >
                    {isApplying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    {pendingActions.length > 1 ? `Approve All (${pendingActions.length})` : 'Approve'}
                  </button>
                  <button
                    onClick={rejectAll}
                    disabled={isApplying}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-60 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-2xl bg-stone-100 dark:bg-stone-800">
                  <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
                </div>
              </div>
            )}

            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          </div>

          <div className="px-3 py-3 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send() }}
              placeholder="Ask about meals or your pantry…"
              disabled={isLoading}
              className="flex-1 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-stone-400 disabled:opacity-60"
            />
            <button
              onClick={send}
              disabled={isLoading || !input.trim()}
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 transition-colors"
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
