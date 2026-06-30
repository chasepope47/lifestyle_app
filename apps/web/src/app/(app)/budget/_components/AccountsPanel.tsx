'use client'
import { useState, useRef } from 'react'
import { Plus, X, Upload, Link2, Landmark, CreditCard, PiggyBank, Wallet, TrendingUp } from 'lucide-react'
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

const TYPE_ICONS: Record<AccountType, React.ElementType> = {
  checking: Landmark,
  savings: PiggyBank,
  credit: CreditCard,
  cash: Wallet,
  investment: TrendingUp,
}

const TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Checking',
  savings: 'Savings',
  credit: 'Credit Card',
  cash: 'Cash',
  investment: 'Investment',
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

  const closeModal = () => {
    setShowModal(false)
    setEditingAccount(null)
    setStatementFile(null)
  }

  const handleSave = async () => {
    if (!form.name || !form.balance) return
    setIsSaving(true)
    try {
      await onSaveAccount(form, editingAccount?.id)
      closeModal()
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpload = async () => {
    if (!statementFile || !editingAccount) return
    setIsUploading(true)
    try {
      await onUploadStatement(statementFile, editingAccount.id)
      setStatementFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-stone-900 dark:text-stone-50">Accounts</h3>
          <p className={`text-sm font-medium mt-0.5 ${totalBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {formatCurrency(totalBalance)} net
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      <div className="space-y-2">
        {accounts.length === 0 && (
          <p className="text-sm text-stone-400 text-center py-4">No accounts yet. Add one to get started.</p>
        )}
        {accounts.map(acc => {
          const Icon = TYPE_ICONS[acc.type] ?? Landmark
          return (
            <button
              key={acc.id}
              onClick={() => openEdit(acc)}
              className="w-full text-left flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-900 dark:text-stone-50 truncate">{acc.name}</p>
                <p className="text-xs text-stone-500">{TYPE_LABELS[acc.type]} · {acc.currency || 'USD'}</p>
              </div>
              <p className={`text-sm font-semibold flex-shrink-0 ${acc.balance < 0 ? 'text-red-500' : 'text-stone-900 dark:text-stone-50'}`}>
                {formatCurrency(acc.balance)}
              </p>
            </button>
          )
        })}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
                {editingAccount ? 'Edit Account' : 'Add Account'}
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg">
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>

            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Account Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Chase Checking"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm(p => ({ ...p, type: e.target.value as AccountType }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {Object.entries(TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.balance}
                    onChange={e => setForm(p => ({ ...p, balance: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Currency</label>
                  <input
                    type="text"
                    value={form.currency}
                    onChange={e => setForm(p => ({ ...p, currency: e.target.value.toUpperCase() }))}
                    placeholder="USD"
                    maxLength={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving || !form.name || !form.balance}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors mb-3 disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : editingAccount ? 'Update Account' : 'Create Account'}
            </button>

            {editingAccount && (
              <>
                <div className="my-5 border-t border-stone-200 dark:border-stone-700" />

                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">Import Bank Statement</h4>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 text-sm font-medium transition-colors"
                  >
                    <Upload className="w-4 h-4" /> Choose CSV File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={e => setStatementFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  {statementFile && (
                    <div className="mt-2 p-3 bg-stone-50 dark:bg-stone-800 rounded-xl flex items-center justify-between gap-2">
                      <span className="text-xs text-stone-600 dark:text-stone-300 truncate">{statementFile.name}</span>
                      <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="flex-shrink-0 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-60"
                      >
                        {isUploading ? 'Importing…' : 'Import'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="mb-5">
                  <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">Connect Bank</h4>
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-400 text-sm font-medium cursor-not-allowed opacity-50"
                  >
                    <Link2 className="w-4 h-4" /> Connect with Plaid
                  </button>
                  <p className="text-xs text-stone-400 mt-2 text-center">Coming soon</p>
                </div>
              </>
            )}

            <button
              onClick={closeModal}
              className="w-full py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-medium hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
