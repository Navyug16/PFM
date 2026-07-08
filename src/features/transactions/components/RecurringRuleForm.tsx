import React, { useState } from 'react'
import { AlertCircle, Save } from 'lucide-react'
import type { Account, Category } from '@/features/financial/types'
import type { FrequencyType, RecurringRule } from '../types/recurring'

interface RecurringRuleFormProps {
  initialRule?: RecurringRule | null
  accounts: Account[]
  categories: Category[]
  onSubmit: (rule: {
    name: string
    transaction_type: 'income' | 'expense'
    account_id: string
    category_id: string | null
    amount: number
    currency: string
    frequency: FrequencyType
    start_date: string
    end_date: string | null
    description: string | null
  }) => Promise<void>
  onCancel?: () => void
}

export const RecurringRuleForm: React.FC<RecurringRuleFormProps> = ({
  initialRule,
  accounts,
  categories,
  onSubmit,
  onCancel
}) => {
  const [name, setName] = useState(initialRule?.name || '')
  const [type, setType] = useState<'income' | 'expense'>(initialRule?.transaction_type || 'expense')
  const [accountId, setAccountId] = useState(initialRule?.account_id || (accounts.length > 0 ? accounts[0].id : ''))
  const [categoryId, setCategoryId] = useState(initialRule?.category_id || '')
  const [amount, setAmount] = useState(initialRule?.amount ? initialRule.amount.toString() : '')
  const [frequency, setFrequency] = useState<FrequencyType>(initialRule?.frequency || 'monthly')
  const [startDate, setStartDate] = useState(initialRule?.start_date || new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(initialRule?.end_date || '')
  const [description, setDescription] = useState(initialRule?.description || '')

  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!name.trim()) {
      setFormError('Rule name is required.')
      return
    }

    const amtNum = parseFloat(amount)
    if (isNaN(amtNum) || amtNum <= 0) {
      setFormError('Amount must be a valid positive number.')
      return
    }

    if (!accountId) {
      setFormError('Account selection is required.')
      return
    }

    if (endDate && startDate > endDate) {
      setFormError('End date cannot be earlier than start date.')
      return
    }

    setLoading(true)
    try {
      const selectedAcc = accounts.find((a) => a.id === accountId)
      const currency = selectedAcc?.currency_code || 'INR'

      await onSubmit({
        name: name.trim(),
        transaction_type: type,
        account_id: accountId,
        category_id: categoryId || null,
        amount: amtNum,
        currency,
        frequency,
        start_date: startDate,
        end_date: endDate || null,
        description: description.trim() || null
      })
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save recurring rule.')
    } finally {
      setLoading(false)
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
          <label htmlFor="rule-form-type" className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
            Transaction Type
          </label>
          <select
            id="rule-form-type"
            value={type}
            onChange={(e) => {
              setType(e.target.value as 'income' | 'expense')
              setCategoryId('')
            }}
            disabled={loading}
            className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2.5 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
          >
            <option value="expense">Expense Rule</option>
            <option value="income">Income Rule</option>
          </select>
        </div>

        <div>
          <label htmlFor="rule-form-name" className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
            Rule Name (e.g. Rent, Salary)
          </label>
          <input
            id="rule-form-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Netflix Subscription"
            disabled={loading}
            className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2.5 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="rule-form-amount" className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
              Amount
            </label>
            <input
              id="rule-form-amount"
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={loading}
              className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2.5 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
            />
          </div>

          <div>
            <label htmlFor="rule-form-frequency" className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
              Frequency
            </label>
            <select
              id="rule-form-frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as FrequencyType)}
              disabled={loading}
              className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2.5 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="rule-form-account" className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
              Account
            </label>
            <select
              id="rule-form-account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              disabled={loading}
              className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
            >
              <option value="" disabled>Select Account</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency_code})</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="rule-form-category" className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
              Category
            </label>
            <select
              id="rule-form-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={loading}
              className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
            >
              <option value="">Uncategorized</option>
              {activeCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="rule-form-start" className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
              Start Date
            </label>
            <input
              id="rule-form-start"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={loading}
              className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2.5 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
            />
          </div>

          <div>
            <label htmlFor="rule-form-end" className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
              End Date (Optional)
            </label>
            <input
              id="rule-form-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={loading}
              className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2.5 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
            />
          </div>
        </div>

        <div>
          <label htmlFor="rule-form-desc" className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
            Description Notes (Optional)
          </label>
          <textarea
            id="rule-form-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add schedule context..."
            disabled={loading}
            rows={2}
            className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2 text-text-primary text-sm outline-none focus:border-brand-purple transition-all resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-2.5 bg-surface-secondary hover:bg-surface-secondary/85 text-text-secondary font-semibold text-sm rounded-custom-md border border-border-neutral cursor-pointer transition-all"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-brand-purple hover:bg-brand-purple/90 text-text-primary font-semibold text-sm rounded-custom-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Save size={16} /> {loading ? 'Saving...' : 'Save Schedule Rule'}
          </button>
        </div>
      </form>
    </div>
  )
}
