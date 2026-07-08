import React, { useState } from 'react'
import { Plus, AlertCircle, Save } from 'lucide-react'
import { createTransaction, updateTransaction } from '@/features/financial/api/financial-api'
import { validateTransaction } from '@/features/financial/validation'
import type { Account, Category, Transaction, TransactionType } from '@/features/financial/types'

interface TransactionFormProps {
  initialTransaction?: Partial<Transaction> | null
  accounts: Account[]
  categories: Category[]
  onSuccess: () => void | Promise<void>
  onCancel?: () => void
  defaultType?: TransactionType
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  initialTransaction,
  accounts,
  categories,
  onSuccess,
  onCancel,
  defaultType = 'expense'
}) => {
  const [type, setType] = useState<TransactionType>(initialTransaction?.transaction_type || defaultType)
  const [amount, setAmount] = useState(initialTransaction?.amount ? initialTransaction.amount.toString() : '')
  const [accountId, setAccountId] = useState(initialTransaction?.account_id || '')
  const [categoryId, setCategoryId] = useState(initialTransaction?.category_id || '')
  const [transferToAccountId, setTransferToAccountId] = useState(initialTransaction?.transfer_to_account_id || '')
  const [date, setDate] = useState(initialTransaction?.transaction_date || new Date().toISOString().split('T')[0])
  const [payeeOrSource, setPayeeOrSource] = useState(initialTransaction?.payee_or_source || '')
  const [notes, setNotes] = useState(initialTransaction?.notes || '')
  
  const [actionLoading, setActionLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const amtNum = parseFloat(amount) || 0
    const catVal = type === 'transfer' ? null : categoryId || null
    const destVal = type === 'transfer' ? transferToAccountId : null
    const resolvedAccountId = accountId || (accounts.length > 0 ? accounts[0].id : '')

    const validationErr = validateTransaction(amtNum, date, resolvedAccountId, type, catVal, destVal)
    if (validationErr) {
      setFormError(validationErr)
      return
    }

    setActionLoading(true)
    try {
      const txData = {
        transaction_type: type,
        amount: amtNum,
        account_id: resolvedAccountId,
        category_id: catVal,
        transfer_to_account_id: destVal,
        transaction_date: date,
        payee_or_source: payeeOrSource.trim() || null,
        notes: notes.trim() || null
      }

      if (initialTransaction && initialTransaction.id) {
        await updateTransaction(initialTransaction.id, txData)
      } else {
        await createTransaction(txData)
        // Clear inputs only on new creation
        setAmount('')
        setPayeeOrSource('')
        setNotes('')
        setCategoryId('')
        setTransferToAccountId('')
      }
      
      await onSuccess()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save transaction.')
    } finally {
      setActionLoading(false)
    }
  }

  const activeCategories = categories.filter((c) => c.transaction_type === type)

  return (
    <div className="space-y-4">
      {formError && (
        <div className="p-3 bg-state-expense/10 border border-state-expense/20 text-state-expense rounded-custom-md flex items-start gap-2 text-sm">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="tx-form-type" className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
            Transaction Type
          </label>
          <select
            id="tx-form-type"
            value={type}
            onChange={(e) => {
              setType(e.target.value as TransactionType)
              setCategoryId('')
              setTransferToAccountId('')
            }}
            disabled={actionLoading}
            className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2.5 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="transfer">Transfer (Internal)</option>
          </select>
        </div>

        <div>
          <label htmlFor="tx-form-amount" className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
            Amount
          </label>
          <input
            id="tx-form-amount"
            type="number"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            disabled={actionLoading}
            className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2.5 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="tx-form-source" className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
              {type === 'transfer' ? 'From Account' : 'Account'}
            </label>
            <select
              id="tx-form-source"
              value={accountId || (accounts.length > 0 ? accounts[0].id : '')}
              onChange={(e) => setAccountId(e.target.value)}
              disabled={actionLoading}
              className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
            >
              <option value="" disabled>Select</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>

          {type === 'transfer' ? (
            <div>
              <label htmlFor="tx-form-dest" className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
                To Account
              </label>
              <select
                id="tx-form-dest"
                value={transferToAccountId}
                onChange={(e) => setTransferToAccountId(e.target.value)}
                disabled={actionLoading}
                className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
              >
                <option value="">Select Destination</option>
                {accounts
                  .filter((acc) => acc.id !== accountId)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
              </select>
            </div>
          ) : (
            <div>
              <label htmlFor="tx-form-category" className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
                Category
              </label>
              <select
                id="tx-form-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={actionLoading}
                className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
              >
                <option value="">Uncategorized</option>
                {activeCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="tx-form-date" className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
            Transaction Date
          </label>
          <input
            id="tx-form-date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={actionLoading}
            className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2.5 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
          />
        </div>

        <div>
          <label htmlFor="tx-form-payee" className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
            {type === 'income' ? 'Source' : type === 'transfer' ? 'Reference' : 'Payee'}
          </label>
          <input
            id="tx-form-payee"
            type="text"
            value={payeeOrSource}
            onChange={(e) => setPayeeOrSource(e.target.value)}
            placeholder="e.g. Starbucks, Salary"
            disabled={actionLoading}
            className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2.5 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
          />
        </div>

        <div>
          <label htmlFor="tx-form-notes" className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
            Notes
          </label>
          <textarea
            id="tx-form-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes"
            disabled={actionLoading}
            rows={2}
            className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2 text-text-primary text-sm outline-none focus:border-brand-purple transition-all resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={actionLoading}
              className="flex-1 py-2.5 bg-surface-secondary hover:bg-surface-secondary/85 text-text-secondary font-semibold text-sm rounded-custom-md border border-border-neutral cursor-pointer transition-all"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={actionLoading}
            className="flex-1 py-2.5 bg-brand-purple hover:bg-brand-purple/90 text-text-primary font-semibold text-sm rounded-custom-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {initialTransaction ? <Save size={16} /> : <Plus size={16} />} 
            {actionLoading ? 'Saving...' : initialTransaction ? 'Save Changes' : 'Add Entry'}
          </button>
        </div>
      </form>
    </div>
  )
}
