import React from 'react'
import { AlertCircle, Inbox } from 'lucide-react'
import type { CategoryBudgetDetails } from '../hooks/useBudgetData'

interface CategoryAllocationsProps {
  categoryBreakdown: CategoryBudgetDetails[]
  uncategorizedSpending: number
  totalAllocatedAmount: number
  totalUnallocatedAmount: number
  totalLimit: number
}

export const CategoryAllocations: React.FC<CategoryAllocationsProps> = ({
  categoryBreakdown,
  uncategorizedSpending,
  totalAllocatedAmount,
  totalUnallocatedAmount,
  totalLimit,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val)
  }

  const getPaceColor = (status: string) => {
    switch (status) {
      case 'exceeded':
        return 'text-state-expense bg-state-expense/10 border-state-expense/20'
      case 'at_risk':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20'
      case 'watch':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
      case 'safe':
        return 'text-state-positive bg-state-positive/10 border-state-positive/20'
      default:
        return 'text-text-secondary bg-surface-secondary border-border-neutral'
    }
  }

  const getProgressColor = (usage: number) => {
    if (usage >= 100) return 'bg-state-expense'
    if (usage >= 85) return 'bg-amber-500'
    return 'bg-brand-purple'
  }

  return (
    <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-6 shadow-sm space-y-6">
      <h3 className="text-base font-bold text-text-primary">Category Budgets & Allocations</h3>

      <div className="space-y-5">
        
        {/* Allocated category limits */}
        {categoryBreakdown.map((cat) => {
          const usageClamped = Math.min(cat.usagePercentage, 100)
          return (
            <div key={cat.categoryId} className="space-y-2 border-b border-border-neutral/40 pb-4 last:border-b-0 last:pb-0">
              <div className="flex items-center justify-between">
                
                {/* Category Identity */}
                <div className="flex items-center gap-2">
                  <span className="text-xl shrink-0" role="img" aria-label={cat.categoryName}>
                    {cat.categoryIcon || '📁'}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">{cat.categoryName}</h4>
                    <span className="text-xs text-text-secondary">
                      {formatCurrency(cat.spent)} spent of {formatCurrency(cat.allocated)}
                    </span>
                  </div>
                </div>

                {/* Pace status */}
                <span className={`text-[9px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded-custom-full ${getPaceColor(cat.paceStatus)}`}>
                  {cat.paceStatus === 'at_risk' ? 'At Risk' : cat.paceStatus}
                </span>

              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-surface-secondary rounded-custom-full overflow-hidden">
                <div
                  className={`h-full ${getProgressColor(cat.usagePercentage)} transition-all duration-300`}
                  style={{ width: `${usageClamped}%` }}
                />
              </div>
            </div>
          )
        })}

        {/* Uncategorized Expenses (Expenses with no category allocations) */}
        {uncategorizedSpending > 0 && (
          <div className="space-y-2 border-b border-border-neutral/40 pb-4 last:border-b-0 last:pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-surface-secondary border border-border-neutral rounded-custom-md flex items-center justify-center shrink-0">
                  <Inbox size={16} className="text-text-secondary" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary">Uncategorized Expenses</h4>
                  <span className="text-xs text-text-secondary">
                    {formatCurrency(uncategorizedSpending)} spent outside allocated categories
                  </span>
                </div>
              </div>

              <span className="text-xs text-text-secondary font-medium">
                Counts towards overall limit
              </span>
            </div>
            
            {/* Show relative to remaining unallocated allowance if available */}
            {totalUnallocatedAmount > 0 && (
              <div className="w-full h-2 bg-surface-secondary rounded-custom-full overflow-hidden">
                <div
                  className="h-full bg-slate-500 transition-all duration-300"
                  style={{ width: `${Math.min((uncategorizedSpending / totalUnallocatedAmount) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Unallocated Budget Summary block */}
        <div className="pt-4 border-t border-border-neutral/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Allocation Status</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-text-primary">
                {formatCurrency(totalAllocatedAmount)} Allocated
              </span>
              <span className="text-xs text-text-secondary">
                of {formatCurrency(totalLimit)} Limit
              </span>
            </div>
          </div>

          <div className="text-right space-y-1">
            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Unallocated Margin</h4>
            <span className={`text-sm font-bold ${totalUnallocatedAmount > 0 ? 'text-state-positive' : 'text-text-secondary'}`}>
              {formatCurrency(totalUnallocatedAmount)} Available
            </span>
          </div>
        </div>

        {totalUnallocatedAmount > 0 && (
          <div className="flex items-start gap-2 bg-surface-secondary border border-border-neutral rounded-custom-md p-3.5 text-xs text-text-secondary">
            <AlertCircle size={14} className="shrink-0 mt-0.5 text-brand-purple" />
            <span>
              You have {formatCurrency(totalUnallocatedAmount)} of your spending limit unallocated. You can edit this plan to assign it to category budgets.
            </span>
          </div>
        )}

      </div>
    </div>
  )
}
