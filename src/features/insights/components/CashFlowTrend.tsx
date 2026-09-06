import React from 'react'
import type { TrendPoint } from '@/features/insights/utils/report-calculations'
import { formatCurrency as sharedFormatCurrency } from '@/features/financial/utils/formatters'
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react'

interface CashFlowTrendProps {
  trendPoints: TrendPoint[]
  primaryCurrency?: string
  userLocale?: string
}

export const CashFlowTrend: React.FC<CashFlowTrendProps> = ({
  trendPoints,
  primaryCurrency = 'INR',
  userLocale = 'en-IN'
}) => {
  const formatCurrency = (val: number, curr?: string) => {
    return sharedFormatCurrency(val, curr || primaryCurrency, userLocale, {
      maximumFractionDigits: 0
    })
  }

  // Empty State: 0 trend points
  if (trendPoints.length === 0) {
    return (
      <div className="bg-surface-secondary border border-border-neutral rounded-custom-xl p-6 text-center space-y-2">
        <h4 className="text-sm font-bold text-text-primary">No cash flow trend data available</h4>
        <p className="text-xs text-text-secondary max-w-sm mx-auto">
          Log income or expense transactions across time intervals to visualize your cash flow trend.
        </p>
      </div>
    )
  }

  // Low-Data State: 1 trend point (Summary View instead of misleading 1-bar chart)
  if (trendPoints.length < 2) {
    const pt = trendPoints[0]
    const netVal = pt.income - pt.expenses
    const isSurplus = netVal >= 0

    return (
      <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border-neutral/40 pb-2">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Calendar size={14} className="text-brand-orange" />
            <span>Period Outlays Summary</span>
          </h3>
          <span className="text-[10px] text-text-secondary font-medium px-2 py-0.5 rounded-custom-full bg-surface-secondary">
            {pt.label}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-surface-secondary/40 border border-border-neutral/40 rounded-custom-lg p-3">
            <span className="text-[10px] text-text-secondary font-semibold uppercase block">Income</span>
            <span className="text-sm font-bold text-state-positive mt-0.5 block tabular-nums">
              {formatCurrency(pt.income)}
            </span>
          </div>

          <div className="bg-surface-secondary/40 border border-border-neutral/40 rounded-custom-lg p-3">
            <span className="text-[10px] text-text-secondary font-semibold uppercase block">Expenses</span>
            <span className="text-sm font-bold text-state-expense mt-0.5 block tabular-nums">
              {formatCurrency(pt.expenses)}
            </span>
          </div>

          <div className="bg-surface-secondary/40 border border-border-neutral/40 rounded-custom-lg p-3">
            <span className="text-[10px] text-text-secondary font-semibold uppercase block">Net Flow</span>
            <span className={`text-sm font-bold mt-0.5 block tabular-nums ${isSurplus ? 'text-state-positive' : 'text-state-expense'}`}>
              {isSurplus ? '+' : ''}{formatCurrency(netVal)}
            </span>
          </div>

          <div className="bg-surface-secondary/40 border border-border-neutral/40 rounded-custom-lg p-3">
            <span className="text-[10px] text-text-secondary font-semibold uppercase block">Savings Rate</span>
            <span className="text-sm font-bold text-brand-orange mt-0.5 block tabular-nums">
              {pt.savingsRate.toFixed(0)}%
            </span>
          </div>
        </div>

        <p className="text-[11px] text-text-muted text-center italic">
          Additional intervals will appear automatically as multi-period activity compiles.
        </p>
      </div>
    )
  }

  // Find max value across all intervals for proportional bar scaling
  const maxVal = Math.max(
    ...trendPoints.map((pt) => Math.max(pt.income, pt.expenses)),
    100
  )

  return (
    <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-5 sm:p-6 space-y-5 shadow-sm">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-neutral/40">
        <div>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            Income vs Expenses Trend
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Periodic earnings vs spending comparison
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-state-positive/20 border border-state-positive rounded-custom-xs" />
            <span className="text-text-secondary">Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-state-expense/20 border border-state-expense rounded-custom-xs" />
            <span className="text-text-secondary">Expenses</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-brand-orange/20 border border-brand-orange rounded-custom-xs" />
            <span className="text-text-secondary">Net</span>
          </div>
        </div>
      </div>

      {/* Desktop / Tablet Paired Visualization (Hidden on small mobile <640px) */}
      <div className="hidden sm:block space-y-4">
        {trendPoints.map((pt, idx) => {
          const net = pt.income - pt.expenses
          const isSurplus = net >= 0
          const incPct = maxVal > 0 ? (pt.income / maxVal) * 100 : 0
          const expPct = maxVal > 0 ? (pt.expenses / maxVal) * 100 : 0

          return (
            <div key={idx} className="bg-surface-secondary/30 border border-border-neutral/40 rounded-custom-lg p-3.5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-text-primary">{pt.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold flex items-center gap-1 text-xs px-2 py-0.5 rounded-custom-full ${
                    isSurplus
                      ? 'bg-state-positive/10 text-state-positive border border-state-positive/20'
                      : 'bg-state-expense/10 text-state-expense border border-state-expense/20'
                  }`}>
                    {isSurplus ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {isSurplus ? '+' : ''}{formatCurrency(net)} {isSurplus ? 'Surplus' : 'Deficit'}
                  </span>
                </div>
              </div>

              {/* Bars Grid */}
              <div className="space-y-1.5 pt-1">
                {/* Income Bar */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-14 text-[10px] uppercase font-semibold text-text-muted shrink-0">
                    Income
                  </span>
                  <div className="flex-1 bg-surface-secondary rounded-full h-3 overflow-hidden border border-border-neutral/30 flex items-center">
                    <div
                      className="bg-state-positive/20 border-r-2 border-state-positive h-full transition-all duration-500 rounded-full"
                      style={{ width: `${Math.max(incPct, pt.income > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                  <span className="w-20 text-right font-bold text-state-positive tabular-nums shrink-0">
                    {formatCurrency(pt.income)}
                  </span>
                </div>

                {/* Expense Bar */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-14 text-[10px] uppercase font-semibold text-text-muted shrink-0">
                    Expense
                  </span>
                  <div className="flex-1 bg-surface-secondary rounded-full h-3 overflow-hidden border border-border-neutral/30 flex items-center">
                    <div
                      className="bg-state-expense/20 border-r-2 border-state-expense h-full transition-all duration-500 rounded-full"
                      style={{ width: `${Math.max(expPct, pt.expenses > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                  <span className="w-20 text-right font-bold text-state-expense tabular-nums shrink-0">
                    {formatCurrency(pt.expenses)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile Stacked Interval Cards (Visible on small mobile <640px) */}
      <div className="sm:hidden space-y-3">
        {trendPoints.map((pt, idx) => {
          const net = pt.income - pt.expenses
          const isSurplus = net >= 0

          return (
            <div key={idx} className="bg-surface-secondary/40 border border-border-neutral/60 rounded-custom-lg p-3.5 space-y-2.5">
              <div className="flex justify-between items-center border-b border-border-neutral/30 pb-2">
                <span className="text-xs font-bold text-text-primary">{pt.label}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-custom-full ${
                  isSurplus
                    ? 'bg-state-positive/10 text-state-positive'
                    : 'bg-state-expense/10 text-state-expense'
                }`}>
                  {isSurplus ? 'Surplus' : 'Deficit'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div>
                  <span className="text-[10px] text-text-muted uppercase block font-semibold">Income</span>
                  <span className="font-bold text-state-positive tabular-nums mt-0.5 block">
                    {formatCurrency(pt.income)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted uppercase block font-semibold">Expenses</span>
                  <span className="font-bold text-state-expense tabular-nums mt-0.5 block">
                    {formatCurrency(pt.expenses)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted uppercase block font-semibold">Net Flow</span>
                  <span className={`font-bold tabular-nums mt-0.5 block ${isSurplus ? 'text-state-positive' : 'text-state-expense'}`}>
                    {isSurplus ? '+' : ''}{formatCurrency(net)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
