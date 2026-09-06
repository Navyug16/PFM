import React from 'react'
import { formatCurrency as sharedFormatCurrency } from '@/features/financial/utils/formatters'
import { TrendingUp } from 'lucide-react'

interface FinancialHealthCardProps {
  periodIncome?: { [currency: string]: number }
  periodExpenses?: { [currency: string]: number }
  periodSavings: { [currency: string]: number }
  savingsRate: { [currency: string]: number }
  primaryCurrency?: string
  userLocale?: string
}

export const FinancialHealthCard: React.FC<FinancialHealthCardProps> = ({
  periodIncome: _periodIncome,
  periodExpenses: _periodExpenses,
  periodSavings,
  savingsRate,
  primaryCurrency = 'INR',
  userLocale = 'en-IN'
}) => {
  const formatCurrency = (val: number) => {
    const safeVal = typeof val === 'number' && !isNaN(val) ? val : 0
    return sharedFormatCurrency(safeVal, primaryCurrency, userLocale, {
      maximumFractionDigits: 0
    })
  }

  const ncf = (periodSavings && periodSavings[primaryCurrency]) || 0
  const sr = Math.min(100, Math.max(0, (savingsRate && savingsRate[primaryCurrency]) || 0))

  return (
    <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-5 shadow-sm flex flex-col justify-between h-full min-h-[260px]">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
          Financial Health
        </h3>
        <span className="text-[10px] font-semibold text-text-muted">Current status</span>
      </div>

      {/* Main Metric Amount */}
      <div className="my-1">
        <p className="text-2xl font-extrabold text-text-primary tabular-nums tracking-tight">
          {ncf >= 0 ? '+' : ''}{formatCurrency(ncf)}
        </p>
        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
          <TrendingUp size={11} /> Savings rate status
        </span>
      </div>

      {/* Semi-circle Gauge matching ACRU reference */}
      <div className="my-auto flex flex-col items-center justify-center relative pt-2">
        <div className="relative w-28 h-14 overflow-hidden flex items-end justify-center">
          <svg className="w-28 h-28 transform -rotate-180">
            <circle
              cx="56"
              cy="56"
              r="46"
              stroke="currentColor"
              strokeWidth="10"
              className="text-surface-secondary"
              fill="transparent"
              strokeDasharray={289}
              strokeDashoffset={144.5}
            />
            <circle
              cx="56"
              cy="56"
              r="46"
              stroke="currentColor"
              strokeWidth="10"
              className="text-brand-orange transition-all duration-700"
              fill="transparent"
              strokeDasharray={289}
              strokeDashoffset={289 - (144.5 * sr) / 100}
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="text-center mt-1">
          <span className="text-lg font-black text-text-primary tabular-nums">{sr.toFixed(0)}%</span>
          <span className="text-[10px] font-semibold text-text-muted block">Of income saved</span>
        </div>
      </div>

      {/* Subtext */}
      <div className="pt-2 border-t border-border-neutral/30 text-[10px] text-text-muted text-center">
        Based on transaction metrics for this period
      </div>
    </div>
  )
}
