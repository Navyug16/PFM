import React, { useState } from 'react'
import { AlertTriangle, Save, X } from 'lucide-react'
import type { Category } from '../../financial/types'
import type { BudgetWithAllocations } from '../types'
import { formatCurrency as sharedFormatCurrency } from '@/features/financial/utils/formatters'

interface BudgetFormProps {
  initialBudget?: BudgetWithAllocations | null
  expenseCategories: Category[]
  onSubmit: (
    budget: { name: string; start_date: string; end_date: string; total_limit: number },
    allocations: { category_id: string; allocated_amount: number }[]
  ) => Promise<void>
  onCancel?: () => void
}

export const BudgetForm: React.FC<BudgetFormProps> = ({
  initialBudget,
  expenseCategories,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState(initialBudget?.name || '')
  
  const [startDate, setStartDate] = useState(() => {
    if (initialBudget) return initialBudget.start_date
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    return `${y}-${m}-01`
  })
  
  const [endDate, setEndDate] = useState(() => {
    if (initialBudget) return initialBudget.end_date
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()
    const lastDay = new Date(y, m + 1, 0).getDate()
    return `${y}-${String(m + 1).padStart(2, '0')}-${lastDay}`
  })
  
  const [totalLimit, setTotalLimit] = useState(
    initialBudget ? initialBudget.total_limit.toString() : ''
  )
  
  // Category allocation limits map, keyed by categoryId
  const [allocations, setAllocations] = useState<{ [catId: string]: string }>(() => {
    if (!initialBudget) return {}
    const allocsMap: { [catId: string]: string } = {}
    initialBudget.allocations.forEach((alloc) => {
      allocsMap[alloc.category_id] = alloc.allocated_amount.toString()
    })
    return allocsMap
  })
  
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const limitNum = parseFloat(totalLimit) || 0

  // Calculate allocated sum
  const allocatedSum = Object.values(allocations).reduce((sum, val) => {
    const num = parseFloat(val) || 0
    return sum + num
  }, 0)

  const unallocatedAmount = limitNum - allocatedSum
  const isAllocationOverBudget = allocatedSum > limitNum

  const handleAllocationChange = (catId: string, value: string) => {
    setAllocations((prev) => ({
      ...prev,
      [catId]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!name.trim()) {
      setFormError('Please enter a budget name')
      return
    }
    if (!startDate || !endDate) {
      setFormError('Please select active dates')
      return
    }
    if (endDate < startDate) {
      setFormError('End date must be on or after start date')
      return
    }
    if (limitNum <= 0) {
      setFormError('Budget limit must be greater than zero')
      return
    }
    if (isAllocationOverBudget) {
      setFormError('Total allocated category limits cannot exceed the overall budget limit')
      return
    }

    setLoading(false)
    try {
      setLoading(true)
      
      // Filter out empty or 0 allocations
      const finalAllocs = Object.entries(allocations)
        .map(([catId, val]) => ({
          category_id: catId,
          allocated_amount: parseFloat(val) || 0,
        }))
        .filter((a) => a.allocated_amount > 0)

      await onSubmit(
        {
          name: name.trim(),
          start_date: startDate,
          end_date: endDate,
          total_limit: limitNum,
        },
        finalAllocs
      )
    } catch (err: unknown) {
      console.error(err)
      setFormError(err instanceof Error ? err.message : 'Failed to save spending budget plan')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (val: number) => sharedFormatCurrency(val, 'INR', { maximumFractionDigits: 0 })

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {formError && (
        <div className="p-3 bg-state-expense/10 border border-state-expense/20 text-state-expense rounded-custom-md flex items-start gap-2 text-xs">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      {/* Main Budget Metadata */}
      <div className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="budgetName" className="text-xs font-bold text-text-secondary uppercase">
            Budget Plan Name
          </label>
          <input
            id="budgetName"
            type="text"
            className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-3.5 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple"
            placeholder="e.g. July 2026 Household Budget"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="budgetStart" className="text-xs font-bold text-text-secondary uppercase">
              Start Date
            </label>
            <input
              id="budgetStart"
              type="date"
              className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-3.5 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="budgetEnd" className="text-xs font-bold text-text-secondary uppercase">
              End Date
            </label>
            <input
              id="budgetEnd"
              type="date"
              className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-3.5 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="budgetLimit" className="text-xs font-bold text-text-secondary uppercase">
            Total Spending Limit (₹)
          </label>
          <input
            id="budgetLimit"
            type="number"
            step="0.01"
            className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-3.5 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-purple font-mono"
            placeholder="e.g. 30000"
            value={totalLimit}
            onChange={(e) => setTotalLimit(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      {/* Category allocations overrides block */}
      <div className="space-y-4 pt-4 border-t border-border-neutral/60">
        <div>
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Allocate Categories limits (Optional)
          </h3>
          <p className="text-[11px] text-text-secondary mt-1">
            Assign parts of your total limit to specific categories. Remaining unallocated amounts are left as a buffer.
          </p>
        </div>

        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {expenseCategories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-lg" role="img" aria-label={cat.name}>
                  {cat.icon || '📁'}
                </span>
                <span className="text-xs font-semibold text-text-primary">{cat.name}</span>
              </div>

              <div className="flex items-center gap-1.5 w-32">
                <span className="text-xs text-text-secondary">₹</span>
                <input
                  type="number"
                  step="1"
                  className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-2 py-1 text-xs text-text-primary text-right font-mono focus:outline-none focus:border-brand-purple"
                  placeholder="0"
                  value={allocations[cat.id] || ''}
                  onChange={(e) => handleAllocationChange(cat.id, e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Margin Indicator */}
        <div className="bg-surface-secondary border border-border-neutral rounded-custom-md p-3.5 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-text-secondary">Total Allocated:</span>
            <span className="font-semibold text-text-primary">{formatCurrency(allocatedSum)}</span>
          </div>

          <div className="flex justify-between border-t border-border-neutral/40 pt-2">
            <span className="text-text-secondary">Unallocated Buffer:</span>
            <span className={`font-bold ${isAllocationOverBudget ? 'text-state-expense' : 'text-state-positive'}`}>
              {formatCurrency(unallocatedAmount)}
            </span>
          </div>

          {isAllocationOverBudget && (
            <p className="text-[10px] text-state-expense font-medium mt-1">
              ⚠️ Allocated amount exceeds the total budget limit. Please reduce category allocations.
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border-neutral/40">
        {onCancel && (
          <button
            type="button"
            className="flex items-center gap-1 px-4 py-2 border border-border-neutral rounded-custom-md text-xs font-semibold text-text-secondary hover:bg-surface-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            <X size={14} /> Cancel
          </button>
        )}
        <button
          type="submit"
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-custom-md text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || isAllocationOverBudget}
        >
          <Save size={14} />
          {loading ? 'Saving...' : 'Save Spending Plan'}
        </button>
      </div>

    </form>
  )
}
