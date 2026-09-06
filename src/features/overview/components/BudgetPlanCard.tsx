import React from 'react'
import type { BudgetDataResult } from '@/features/budgets/hooks/useBudgetData'
import { formatCurrency as sharedFormatCurrency } from '@/features/financial/utils/formatters'
import { Edit3 } from 'lucide-react'
import { Link } from 'react-router-dom'

interface BudgetPlanCardProps {
  budgetInfo: BudgetDataResult
  primaryCurrency?: string
  userLocale?: string
}

export const BudgetPlanCard: React.FC<BudgetPlanCardProps> = ({
  budgetInfo,
  primaryCurrency = 'INR',
  userLocale = 'en-IN'
}) => {
  const formatCurrency = (val: number) => {
    return sharedFormatCurrency(val, primaryCurrency, userLocale, {
      maximumFractionDigits: 0
    })
  }

  const { activeBudget, spent, usagePercentage, dailySafeToSpend, loading } = budgetInfo
  const limit = activeBudget?.total_limit || 0
  const pct = Math.min(100, Math.max(0, usagePercentage || 0))

  return (
    <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-5 shadow-sm flex flex-col justify-between h-full min-h-[170px]">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            Monthly Spending Limit
          </h3>
          <span className="text-[10px] text-text-muted">Budget allocations & daily pace</span>
        </div>
        <Link to="/planning" className="text-text-muted hover:text-brand-orange transition-all p-1">
          <Edit3 size={15} />
        </Link>
      </div>

      {/* Main Budget Progress */}
      {loading ? (
        <div className="space-y-2 py-2 animate-pulse">
          <div className="h-4 bg-surface-secondary rounded w-3/4" />
          <div className="h-3 bg-surface-secondary rounded w-full" />
        </div>
      ) : !activeBudget ? (
        <div className="my-auto py-2 flex items-center justify-between gap-4">
          <p className="text-xs text-text-secondary">No active budget plan configured for this period.</p>
          <Link
            to="/planning"
            className="text-xs font-bold text-brand-orange bg-brand-orange/10 hover:bg-brand-orange/20 px-3 py-1.5 rounded-custom-md transition-all shrink-0"
          >
            Setup Plan +
          </Link>
        </div>
      ) : (
        <div className="my-auto space-y-2 py-2">
          {/* Amounts */}
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-brand-orange">{formatCurrency(spent)}</span>
            <span className="text-text-muted">{formatCurrency(limit)}</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-surface-secondary h-3 rounded-full overflow-hidden border border-border-neutral/40">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pct > 90 ? 'bg-rose-500' : pct > 75 ? 'bg-amber-500' : 'bg-brand-orange'
              }`}
              style={{ width: `${Math.max(2, pct)}%` }}
            />
          </div>

          {/* Subtext */}
          <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
            <span>{pct.toFixed(0)}% limit utilized</span>
            <span className="font-bold text-text-primary">
              Daily Safe: <span className="text-brand-orange">{formatCurrency(dailySafeToSpend)}</span>/day
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
