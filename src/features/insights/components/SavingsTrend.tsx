import React from 'react'
import type { TrendPoint } from '../utils/report-calculations'
import { formatCurrency as sharedFormatCurrency } from '@/features/financial/utils/formatters'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface SavingsTrendProps {
  savingsPoints: TrendPoint[]
  primaryCurrency?: string
  userLocale?: string
}

export const SavingsTrend: React.FC<SavingsTrendProps> = ({
  savingsPoints,
  primaryCurrency = 'INR',
  userLocale = 'en-IN'
}) => {
  const formatCurrency = (val: number, curr?: string) => {
    return sharedFormatCurrency(val, curr || primaryCurrency, userLocale, {
      maximumFractionDigits: 0
    })
  }

  if (savingsPoints.length === 0) {
    return (
      <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-6 text-center space-y-2 shadow-sm">
        <h4 className="text-sm font-bold text-text-primary">No savings trend to display</h4>
        <p className="text-xs text-text-secondary max-w-sm mx-auto">
          Savings rate trend points compile automatically as monthly history builds.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-5 sm:p-6 space-y-4 shadow-sm">
      <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider block border-b border-border-neutral/40 pb-2">
        Monthly Savings & Rate Trend
      </h3>
      <div className="space-y-3 pt-1">
        {savingsPoints.map((pt, idx) => {
          const isPositive = pt.savings >= 0
          const TrendIcon = isPositive ? TrendingUp : TrendingDown
          const color = isPositive ? 'text-state-positive' : 'text-state-expense'

          return (
            <div
              key={idx}
              className="flex justify-between items-center bg-surface-secondary/40 border border-border-neutral/40 rounded-custom-lg p-3.5"
            >
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
                <span className="text-[10px] text-text-secondary font-semibold block uppercase">
                  Savings Rate
                </span>
                <span className="text-sm font-bold text-brand-orange tabular-nums">
                  {pt.savingsRate.toFixed(0)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
