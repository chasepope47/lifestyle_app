'use client'
import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Send, Check, Loader2 } from 'lucide-react'
import { formatCurrency } from '@lifestyle/shared'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface PendingAction {
  tool: string
  input: Record<string, unknown>
}

interface BudgetAssistantProps {
  householdId: string
  onDataChanged: () => void
}

function shortId(id: unknown): string {
  return typeof id === 'string' ? id.slice(0, 8) : String(id)
}

function describeAction(action: PendingAction): string {
  const { tool, input } = action
  switch (tool) {
    case 'create_transaction':
      return `Create transaction "${input.description}" for ${formatCurrency(Math.abs(Number(input.amount) || 0))}${Number(input.amount) >= 0 ? ' (income)' : ''}`
    case 'update_transaction':
      return `Update transaction ${shortId(input.id)}`
    case 'delete_transaction':
      return `Delete transaction ${shortId(input.id)}`
    case 'create_category':
      return `Create category "${input.name}"${input.monthly_limit ? ` — ${formatCurrency(Number(input.monthly_limit))}/mo limit` : ''}`
    case 'update_category':
      return `Update category ${shortId(input.id)}${input.name ? ` → "${input.name}"` : ''}`
    case 'delete_category':
      return `Delete category ${shortId(input.id)}`
    case 'create_goal':
      return `Create goal "${input.name}" — target ${formatCurrency(Number(input.target_amount) || 0)}`
    case 'update_goal':
      return `Update goal ${shortId(input.id)}`
    case 'delete_goal':
      return `Delete goal ${shortId(input.id)}`
    default:
      return tool.replace(/_/g, ' ')
  }
}

export function BudgetAssistant({ householdId, onDataChanged }: BudgetAssistantProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, pendingAction, isLoading])

  const send = async () => {
    const text = input.trim()
    if (!text || isLoading) return
    setError(null)
    setPendingAction(null)
    const nextMessages = [...messages, { role: 'user' as const, content: text }]
    setMessages(nextMessages)
    setInput('')
    setIsLoading(true)
    try {
      const res = await fetch('/api/budget/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ householdId, messages: nextMessages }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      if (data.pendingAction) setPendingAction(data.pendingAction)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const approve = async () => {
    if (!pendingAction || isApplying) return
    setIsApplying(true)
    setError(null)
    try {
      const res = await fetch('/api/budget/assistant/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ householdId, tool: pendingAction.tool, input: pendingAction.input }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to apply change')
      setMessages(prev => [...prev, { role: 'assistant', content: 'Done — applied that change.' }])
      setPendingAction(null)
      onDataChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply change')
    } finally {
      setIsApplying(false)
    }
  }

  const reject = () => {
    setMessages(prev => [...prev, { role: 'assistant', content: 'Cancelled — no changes made.' }])
    setPendingAction(null)
  }

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 6px 20px rgba(124,58,237,0.45)' }}
        aria-label={open ? 'Close budget assistant' : 'Open budget assistant'}
      >
        {open ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </button>

      {open && (
        <div className="fixed inset-x-3 bottom-[5.5rem] sm:inset-x-auto sm:bottom-24 sm:right-6 sm:w-96 z-40 flex flex-col rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl max-h-[70vh] overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Budget Assistant</h3>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 min-h-[200px]">
            {messages.length === 0 && (
              <p className="text-xs text-stone-400 dark:text-stone-500 text-center py-6">
                Ask about your spending, categories, or goals — or ask me to set something up for you.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-violet-600 text-white rounded-br-sm'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-100 rounded-bl-sm'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {pendingAction && (
              <div className="rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 p-3">
                <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 mb-2">{describeAction(pendingAction)}</p>
                <div className="flex gap-2">
                  <button
                    onClick={approve}
                    disabled={isApplying}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold disabled:opacity-60 transition-colors"
                  >
                    {isApplying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Approve
                  </button>
                  <button
                    onClick={reject}
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
              placeholder="Ask about your budget…"
              disabled={isLoading}
              className="flex-1 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-stone-400 disabled:opacity-60"
            />
            <button
              onClick={send}
              disabled={isLoading || !input.trim()}
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 transition-colors"
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
