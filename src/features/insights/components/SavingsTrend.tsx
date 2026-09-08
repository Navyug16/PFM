import React from 'react'
import type { TrendPoint } from '../utils/report-calculations'
import { formatCurrency as sharedFormatCurrency } from '@/features/financial/utils/formatters'
import { TrendingUp, TrendingDown, PiggyBank, Percent } from 'lucide-react'

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
      <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-6 text-center space-y-2 shadow-sm flex flex-col justify-center h-full min-h-[320px]">
        <PiggyBank size={32} className="mx-auto text-brand-orange/60" />
        <h4 className="text-sm font-bold text-text-primary">No savings trend to display</h4>
        <p className="text-xs text-text-secondary max-w-sm mx-auto">
          Savings rate trend points compile automatically as monthly history builds.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-5 sm:p-6 space-y-4 shadow-sm flex flex-col justify-between h-full min-h-[320px]">
      <div className="flex items-center justify-between border-b border-border-neutral/40 pb-3">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <PiggyBank size={18} className="text-brand-orange" />
            <span>Monthly Savings & Rate Trend</span>
          </h3>
          <p className="text-xs text-text-secondary">
            Net monthly surplus/deficit progression and savings retention rates
          </p>
        </div>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
        {savingsPoints.map((pt, idx) => {
          const isPositive = pt.savings >= 0
          const TrendIcon = isPositive ? TrendingUp : TrendingDown
          const colorClass = isPositive ? 'text-emerald-400' : 'text-rose-400'
          const bgBadgeClass = isPositive ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'
          const rateClamped = Math.min(100, Math.max(0, pt.savingsRate))

          return (
            <div
              key={idx}
              className="bg-surface-secondary/40 border border-border-neutral/40 rounded-custom-lg p-3.5 space-y-2.5 hover:border-border-neutral/80 transition-all"
            >
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text-primary">{pt.label}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-custom-full border flex items-center gap-1 ${bgBadgeClass} ${colorClass}`}>
                    <TrendIcon size={12} />
                    {isPositive ? '+' : ''}{formatCurrency(pt.savings)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-bold text-brand-orange bg-brand-orange/10 border border-brand-orange/20 px-2.5 py-1 rounded-custom-md">
                  <Percent size={12} />
                  <span>{pt.savingsRate.toFixed(1)}% Rate</span>
                </div>
              </div>

              {/* Savings Rate Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden border border-border-neutral/30">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      rateClamped >= 20
                        ? 'bg-brand-orange'
                        : rateClamped >= 10
                        ? 'bg-emerald-500'
                        : rateClamped > 0
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${rateClamped}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-text-muted">
                  <span>Income: {formatCurrency(pt.income)}</span>
                  <span>Expenses: {formatCurrency(pt.expenses)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
