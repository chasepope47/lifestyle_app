'use client'
import { useState, useRef } from 'react'
import { Plus, X, Upload, Link2, Landmark, CreditCard, PiggyBank, Wallet, TrendingUp, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@lifestyle/shared'
import type { Database } from '@lifestyle/db'

type Account = Database['public']['Tables']['budget_accounts']['Row']
type AccountType = 'checking' | 'savings' | 'credit' | 'cash' | 'investment'

interface AccountForm {
  name: string
  type: AccountType
  balance: string
  currency: string
}

interface AccountsPanelProps {
  accounts: Account[]
  onSaveAccount: (form: AccountForm, editingId?: string) => Promise<void>
  onUploadStatement: (file: File, accountId: string) => Promise<void>
}

const TYPE_CONFIG: Record<AccountType, { Icon: React.ElementType; label: string; color: string; bg: string }> = {
  checking:   { Icon: Landmark,   label: 'Checking',    color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  savings:    { Icon: PiggyBank,  label: 'Savings',     color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  credit:     { Icon: CreditCard, label: 'Credit Card', color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
  cash:       { Icon: Wallet,     label: 'Cash',        color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  investment: { Icon: TrendingUp, label: 'Investment',  color: '#c084fc', bg: 'rgba(192,132,252,0.15)' },
}

export function AccountsPanel({ accounts, onSaveAccount, onUploadStatement }: AccountsPanelProps) {
  const [showModal, setShowModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [form, setForm] = useState<AccountForm>({ name: '', type: 'checking', balance: '', currency: 'USD' })
  const [statementFile, setStatementFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)
  const isPositiveTotal = totalBalance >= 0

  const openAdd = () => {
    setEditingAccount(null)
    setForm({ name: '', type: 'checking', balance: '', currency: 'USD' })
    setStatementFile(null)
    setShowModal(true)
  }

  const openEdit = (acc: Account) => {
    setEditingAccount(acc)
    setForm({ name: acc.name, type: acc.type, balance: acc.balance.toString(), currency: acc.currency || 'USD' })
    setStatementFile(null)
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setEditingAccount(null); setStatementFile(null) }

  const handleSave = async () => {
    if (!form.name || !form.balance) return
    setIsSaving(true)
    try { await onSaveAccount(form, editingAccount?.id); closeModal() }
    finally { setIsSaving(false) }
  }

  const handleUpload = async () => {
    if (!statementFile || !editingAccount) return
    setIsUploading(true)
    try { await onUploadStatement(statementFile, editingAccount.id); setStatementFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }
    finally { setIsUploading(false) }
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden">
      {/* Net worth header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ background: isPositiveTotal ? 'linear-gradient(135deg, rgba(52,211,153,0.08), rgba(52,211,153,0.03))' : 'linear-gradient(135deg, rgba(248,113,113,0.08), rgba(248,113,113,0.03))' }}
      >
        <div>
          <p className="text-xs text-stone-500 font-medium uppercase tracking-wide">Net Worth</p>
          <p className={`text-xl font-bold mt-0.5 ${isPositiveTotal ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
            {formatCurrency(totalBalance)}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {/* Account list */}
      <div className="divide-y divide-stone-50 dark:divide-stone-800/60">
        {accounts.length === 0 && (
          <p className="text-sm text-stone-400 text-center py-6 px-5">No accounts yet. Add one to start tracking.</p>
        )}
        {accounts.map(acc => {
          const cfg = TYPE_CONFIG[acc.type] ?? TYPE_CONFIG.checking
          const { Icon } = cfg
          return (
            <button
              key={acc.id}
              onClick={() => openEdit(acc)}
              className="w-full text-left flex items-center gap-3 px-5 py-3.5 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: cfg.bg }}
              >
                <Icon className="w-4 h-4" style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-900 dark:text-stone-50 truncate">{acc.name}</p>
                <p className="text-xs text-stone-400">{cfg.label} · {acc.currency || 'USD'}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <p className={`text-sm font-bold ${acc.balance < 0 ? 'text-red-500' : 'text-stone-900 dark:text-stone-50'}`}>
                  {formatCurrency(acc.balance)}
                </p>
                <ChevronRight className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          )
        })}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50">
                {editingAccount ? 'Edit Account' : 'Add Account'}
              </h3>
              <button onClick={closeModal} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors">
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>

            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Account Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Chase Checking"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(TYPE_CONFIG) as [AccountType, typeof TYPE_CONFIG[AccountType]][]).map(([type, cfg]) => {
                    const { Icon } = cfg
                    return (
                      <button
                        key={type}
                        onClick={() => setForm(p => ({ ...p, type }))}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all text-xs font-medium ${
                          form.type === type
                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                            : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {cfg.label.split(' ')[0]}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Balance</label>
                  <input
                    type="number" step="0.01" value={form.balance}
                    onChange={e => setForm(p => ({ ...p, balance: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Currency</label>
                  <input
                    type="text" value={form.currency} maxLength={3}
                    onChange={e => setForm(p => ({ ...p, currency: e.target.value.toUpperCase() }))}
                    placeholder="USD"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving || !form.name || !form.balance}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors mb-3 disabled:opacity-60 shadow-sm"
            >
              {isSaving ? 'Saving…' : editingAccount ? 'Update Account' : 'Create Account'}
            </button>

            {editingAccount && (
              <>
                <div className="my-5 border-t border-stone-100 dark:border-stone-800" />
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Import Statement</h4>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-stone-200 dark:border-stone-700 hover:border-violet-400 dark:hover:border-violet-600 text-stone-500 dark:text-stone-400 hover:text-violet-600 dark:hover:text-violet-400 text-sm font-medium transition-all"
                  >
                    <Upload className="w-4 h-4" /> Choose CSV File
                  </button>
                  <input ref={fileInputRef} type="file" accept=".csv" onChange={e => setStatementFile(e.target.files?.[0] || null)} className="hidden" />
                  {statementFile && (
                    <div className="mt-2 p-3 bg-stone-50 dark:bg-stone-800 rounded-xl flex items-center justify-between gap-2">
                      <span className="text-xs text-stone-600 dark:text-stone-300 truncate">{statementFile.name}</span>
                      <button onClick={handleUpload} disabled={isUploading}
                        className="flex-shrink-0 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60">
                        {isUploading ? 'Importing…' : 'Import'}
                      </button>
                    </div>
                  )}
                </div>
                <div className="mb-5">
                  <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Connect Bank</h4>
                  <button disabled className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-400 text-sm font-medium cursor-not-allowed opacity-50">
                    <Link2 className="w-4 h-4" /> Connect with Plaid (coming soon)
                  </button>
                </div>
              </>
            )}

            <button onClick={closeModal}
              className="w-full py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
