import React from 'react'
import type { TrendPoint } from '../utils/report-calculations'
import { formatCurrency } from '@/features/financial/utils/formatters'
import { Calendar } from 'lucide-react'

interface CashFlowTrendProps {
  trendPoints: TrendPoint[]
}

export const CashFlowTrend: React.FC<CashFlowTrendProps> = ({ trendPoints }) => {
  if (trendPoints.length === 0) {
    return (
      <div className="bg-surface-secondary border border-border-neutral rounded-custom-xl p-6 text-center space-y-2">
        <h4 className="text-sm font-bold text-text-primary">No trend data available</h4>
        <p className="text-xs text-text-secondary max-w-sm mx-auto">
          Add some transactions over time to visualize your cash flow history.
        </p>
      </div>
    )
  }

  // Fallback if there is only 1 data point to avoid single-bar misleading charts
  if (trendPoints.length < 2) {
    const pt = trendPoints[0]
    return (
      <div className="bg-surface-secondary border border-border-neutral rounded-custom-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider block border-b border-border-neutral pb-2">
          Period Outlays Summary
        </h3>
        <div className="bg-surface-primary border border-border-neutral rounded-custom-lg p-4 flex flex-col sm:flex-row items-center justify-around gap-4 text-center">
          <div>
            <span className="text-xs text-text-secondary font-semibold block">Interval</span>
            <span className="text-sm font-bold text-text-primary mt-1 block flex items-center gap-1">
              <Calendar size={14} /> {pt.label}
            </span>
          </div>
          <div>
            <span className="text-xs text-text-secondary font-semibold block">Income</span>
            <span className="text-sm font-bold text-state-income mt-1 block">
              {formatCurrency(pt.income)}
            </span>
          </div>
          <div>
            <span className="text-xs text-text-secondary font-semibold block">Expenses</span>
            <span className="text-sm font-bold text-state-expense mt-1 block">
              {formatCurrency(pt.expenses)}
            </span>
          </div>
          <div>
            <span className="text-xs text-text-secondary font-semibold block">Savings Rate</span>
            <span className="text-sm font-bold text-brand-purple mt-1 block">
              {pt.savingsRate.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Find max value in points to scale bars
  const maxVal = Math.max(
    ...trendPoints.map((pt) => Math.max(pt.income, pt.expenses)),
    100 // baseline min to prevent infinite scale
  )

  return (
    <div className="bg-surface-secondary border border-border-neutral rounded-custom-xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-border-neutral pb-2">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
          Income vs Expenses Trend
        </h3>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-state-income/20 border border-state-income rounded" />
            <span className="text-text-secondary">Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-state-expense/20 border border-state-expense rounded" />
            <span className="text-text-secondary">Expenses</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        {trendPoints.map((pt, idx) => (
          <div key={idx} className="grid grid-cols-1 sm:grid-cols-[100px_1fr] items-center gap-2">
            <span className="text-xs font-bold text-text-primary">{pt.label}</span>
            <div className="space-y-1">
              {/* Income Bar */}
              {pt.income > 0 && (
                <div className="flex items-center gap-2">
                  <div
                    className="bg-state-income/20 border border-state-income/40 h-4 rounded transition-all duration-300 min-w-[4px]"
                    style={{ width: `${(pt.income / maxVal) * 100}%` }}
                  />
                  <span className="text-[10px] font-bold text-state-income">
                    {formatCurrency(pt.income)}
                  </span>
                </div>
              )}
              {/* Expenses Bar */}
              {pt.expenses > 0 && (
                <div className="flex items-center gap-2">
                  <div
                    className="bg-state-expense/20 border border-state-expense/40 h-4 rounded transition-all duration-300 min-w-[4px]"
                    style={{ width: `${(pt.expenses / maxVal) * 100}%` }}
                  />
                  <span className="text-[10px] font-bold text-state-expense">
                    {formatCurrency(pt.expenses)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
