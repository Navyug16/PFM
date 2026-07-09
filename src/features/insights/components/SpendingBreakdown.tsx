import React from 'react'
import type { CategoryBreakdownDetail } from '../utils/report-calculations'
import { formatCurrency } from '@/features/financial/utils/formatters'
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react'

interface SpendingBreakdownProps {
  breakdown: CategoryBreakdownDetail[]
}

export const SpendingBreakdown: React.FC<SpendingBreakdownProps> = ({ breakdown }) => {
  if (breakdown.length === 0) {
    return (
      <div className="bg-surface-secondary border border-border-neutral rounded-custom-xl p-6 text-center space-y-2">
        <h4 className="text-sm font-bold text-text-primary">No expense categories to show</h4>
        <p className="text-xs text-text-secondary max-w-sm mx-auto">
          Log expense transactions in this date range to view your category spending breakdown.
        </p>
      </div>
    )
  }

  const renderChangeLabel = (item: CategoryBreakdownDetail) => {
    if (!item.percentChangeAvailable) {
      if (item.direction === 'up' && item.amount > 0) {
        return (
          <span className="text-[11px] font-bold text-state-expense flex items-center gap-0.5">
            <ArrowUpRight size={12} /> New spending (+{formatCurrency(item.amount)})
          </span>
        )
      }
      return (
        <span className="text-[11px] font-semibold text-text-muted flex items-center gap-1">
          <ArrowRight size={12} /> No previous data
        </span>
      )
    }

    if (item.absoluteChange === 0) {
      return (
        <span className="text-[11px] font-semibold text-text-muted flex items-center gap-1">
          <ArrowRight size={12} /> Unchanged
        </span>
      )
    }

    const isUp = item.direction === 'up'
    const color = isUp ? 'text-state-expense' : 'text-state-income'
    const Icon = isUp ? ArrowUpRight : ArrowDownRight
    const label = isUp ? 'increase' : 'decrease'

    return (
      <span className={`text-[11px] font-bold ${color} flex items-center gap-0.5`}>
        <Icon size={12} />
        {item.percentageChange.toFixed(0)}% {label} ({formatCurrency(Math.abs(item.absoluteChange))})
      </span>
    )
  }

  return (
    <div className="bg-surface-secondary border border-border-neutral rounded-custom-xl p-5 space-y-4">
      <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider block border-b border-border-neutral pb-2">
        Spending Breakdown by Category
      </h3>
      <div className="space-y-4">
        {breakdown.map((item) => (
          <div key={item.id} className="space-y-1.5">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-sm font-bold text-text-primary">
                  {item.name}
                </span>
                <span className="text-xs text-text-secondary ml-2">
                  ({item.count} tx{item.count > 1 ? 's' : ''})
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-text-primary">
                  {formatCurrency(item.amount)}
                </span>
                <span className="text-xs text-text-secondary font-semibold ml-2">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-surface-primary rounded-full h-2 border border-border-neutral overflow-hidden">
              <div
                className="bg-brand-purple h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(item.percentage, 100)}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-xs text-text-secondary">
              <span>Avg: {formatCurrency(item.average)} per transaction</span>
              {renderChangeLabel(item)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
