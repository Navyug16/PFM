import React from 'react'
import type { TrendPoint } from '../utils/report-calculations'
import { formatCurrency } from '@/features/financial/utils/formatters'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface SavingsTrendProps {
  savingsPoints: TrendPoint[]
}

export const SavingsTrend: React.FC<SavingsTrendProps> = ({ savingsPoints }) => {
  if (savingsPoints.length === 0) {
    return (
      <div className="bg-surface-secondary border border-border-neutral rounded-custom-xl p-6 text-center space-y-2">
        <h4 className="text-sm font-bold text-text-primary">No savings trend to display</h4>
        <p className="text-xs text-text-secondary max-w-sm mx-auto">
          Savings rate trend points compile automatically as monthly history builds.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-surface-secondary border border-border-neutral rounded-custom-xl p-5 space-y-4">
      <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider block border-b border-border-neutral pb-2">
        Monthly Savings & Rate Trend
      </h3>
      <div className="space-y-3 pt-2">
        {savingsPoints.map((pt, idx) => {
          const isPositive = pt.savings >= 0
          const TrendIcon = isPositive ? TrendingUp : TrendingDown
          const color = isPositive ? 'text-state-income' : 'text-state-expense'

          return (
            <div key={idx} className="flex justify-between items-center bg-surface-primary border border-border-neutral rounded-custom-lg p-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-text-primary">{pt.label}</span>
                <div className="flex items-center gap-1.5">
                  <TrendIcon size={14} className={color} />
                  <span className={`text-xs font-semibold ${color}`}>
                    {isPositive ? 'Surplus' : 'Deficit'} of {formatCurrency(Math.abs(pt.savings))}
                  </span>
                </div>
              </div>
              <div className="text-right space-y-0.5">
                <span className="text-xs text-text-secondary font-semibold block">Savings Rate</span>
                <span className="text-sm font-bold text-brand-purple">{pt.savingsRate.toFixed(0)}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
