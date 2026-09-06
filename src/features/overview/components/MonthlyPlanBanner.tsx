import React from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency as sharedFormatCurrency } from '@/features/financial/utils/formatters'
import type { BudgetInfo } from '@/features/budgets/hooks/useBudgetData'

interface MonthlyPlanBannerProps {
  budgetInfo: BudgetInfo
  primaryCurrency: string
  userLocale: string
}

export const MonthlyPlanBanner: React.FC<MonthlyPlanBannerProps> = ({
  budgetInfo,
  primaryCurrency,
  userLocale
}) => {
  const formatCurrency = (val: number, curr?: string) => {
    return sharedFormatCurrency(val, curr || primaryCurrency, userLocale, {
      maximumFractionDigits: 0
    })
  }

  if (budgetInfo.loading) {
    return (
      <div className="h-28 bg-surface-secondary border border-border-neutral rounded-custom-xl animate-pulse" />
    )
  }

  const getPaceBadgeColor = (status: string) => {
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

  if (!budgetInfo.activeBudget) {
    return (
      <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-text-primary">Monthly spending plan</h4>
          <p className="text-xs text-text-secondary">
            No active budget plan for this period. Set up limits to unlock safe-to-spend insights.
          </p>
        </div>
        <Link
          to="/planning"
          className="text-xs font-bold text-brand-orange hover:underline shrink-0 bg-brand-orange/10 px-3.5 py-2 rounded-custom-md border border-brand-orange/20 text-center"
        >
          Setup Plan
        </Link>
      </div>
    )
  }

  const { spent, activeBudget: budget, usagePercentage, dailySafeToSpend, paceStatus } = budgetInfo

  return (
    <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Monthly Plan
          </span>
          <span
            className={`text-[9px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded-custom-full ${getPaceBadgeColor(
              paceStatus
            )}`}
          >
            {paceStatus === 'at_risk' ? 'At Risk' : paceStatus}
          </span>
        </div>
        <Link to="/planning" className="text-xs font-semibold text-brand-orange hover:underline">
          Adjust Plan &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Progress bar */}
        <div className="space-y-2 flex flex-col justify-center">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-text-secondary">{formatCurrency(spent)} Spent</span>
            <span className="text-text-primary">{formatCurrency(budget.total_limit)} Limit</span>
          </div>
          <div className="w-full h-2 bg-surface-secondary rounded-custom-full overflow-hidden">
            <div
              className="h-full bg-brand-orange transition-all duration-300"
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Right: Safe to spend */}
        <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 md:border-l border-border-neutral/60 pt-3 md:pt-0 md:pl-6">
          <div className="text-left md:text-right">
            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
              Daily safe-to-spend
            </p>
            <p className="text-lg font-extrabold text-text-primary mt-0.5">
              {formatCurrency(dailySafeToSpend)} / day
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
