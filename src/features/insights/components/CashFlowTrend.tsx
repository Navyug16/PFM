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
          Log income or expense transactions across time intervals to visualize your cash flow trend bar chart.
        </p>
      </div>
    )
  }

  // Low-Data State: 1 trend point (Summary Card)
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
            <span className="text-sm font-bold text-emerald-400 mt-0.5 block tabular-nums">
              {formatCurrency(pt.income)}
            </span>
          </div>

          <div className="bg-surface-secondary/40 border border-border-neutral/40 rounded-custom-lg p-3">
            <span className="text-[10px] text-text-secondary font-semibold uppercase block">Expenses</span>
            <span className="text-sm font-bold text-rose-400 mt-0.5 block tabular-nums">
              {formatCurrency(pt.expenses)}
            </span>
          </div>

          <div className="bg-surface-secondary/40 border border-border-neutral/40 rounded-custom-lg p-3">
            <span className="text-[10px] text-text-secondary font-semibold uppercase block">Net Flow</span>
            <span className={`text-sm font-bold mt-0.5 block tabular-nums ${isSurplus ? 'text-emerald-400' : 'text-rose-400'}`}>
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
      </div>
    )
  }

  // Find maximum amount across all points for scaling bar heights
  const maxVal = Math.max(
    ...trendPoints.map((pt) => Math.max(pt.income, pt.expenses)),
    100
  )

  return (
    <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-5 sm:p-6 space-y-5 shadow-sm flex flex-col justify-between h-full">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-neutral/40">
        <div>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            Income vs Expenses Trend Bar Chart
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Side-by-side periodic cash flow comparison
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-emerald-500 rounded-custom-xs" />
            <span className="text-text-secondary">Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-rose-500 rounded-custom-xs" />
            <span className="text-text-secondary">Expenses</span>
          </div>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="pt-4 pb-2">
        <div className="h-56 sm:h-64 flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-border-neutral/60">
          {trendPoints.map((pt, idx) => {
            const incHeightPct = maxVal > 0 ? Math.max((pt.income / maxVal) * 100, pt.income > 0 ? 4 : 0) : 0
            const expHeightPct = maxVal > 0 ? Math.max((pt.expenses / maxVal) * 100, pt.expenses > 0 ? 4 : 0) : 0
            const net = pt.income - pt.expenses
            const isSurplus = net >= 0

            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                {/* Hover Tooltip Card */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none absolute -top-16 bg-surface-secondary border border-border-neutral rounded-custom-md p-2 shadow-lg z-20 whitespace-nowrap text-left text-[11px] space-y-0.5">
                  <div className="font-bold text-text-primary border-b border-border-neutral/40 pb-1 mb-1">
                    {pt.label}
                  </div>
                  <div className="text-emerald-400 font-semibold flex items-center justify-between gap-3">
                    <span>Income:</span>
                    <span>{formatCurrency(pt.income)}</span>
                  </div>
                  <div className="text-rose-400 font-semibold flex items-center justify-between gap-3">
                    <span>Expenses:</span>
                    <span>{formatCurrency(pt.expenses)}</span>
                  </div>
                  <div className={`font-bold border-t border-border-neutral/40 pt-1 mt-1 flex items-center justify-between gap-3 ${isSurplus ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <span>Net:</span>
                    <span>{isSurplus ? '+' : ''}{formatCurrency(net)}</span>
                  </div>
                </div>

                {/* Vertical Bars Pair */}
                <div className="flex items-end gap-1 sm:gap-1.5 w-full justify-center h-full pt-6">
                  {/* Income Bar */}
                  <div
                    className="w-1/2 max-w-[28px] bg-emerald-500/80 group-hover:bg-emerald-500 rounded-t-custom-sm transition-all duration-300 relative flex items-end justify-center"
                    style={{ height: `${incHeightPct}%` }}
                  />

                  {/* Expense Bar */}
                  <div
                    className="w-1/2 max-w-[28px] bg-rose-500/80 group-hover:bg-rose-500 rounded-t-custom-sm transition-all duration-300 relative flex items-end justify-center"
                    style={{ height: `${expHeightPct}%` }}
                  />
                </div>

                {/* X-Axis Interval Label */}
                <span className="text-[10px] sm:text-xs font-semibold text-text-secondary mt-2 truncate max-w-full">
                  {pt.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer Trend Summary Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs border-t border-border-neutral/40">
        <span className="text-text-muted text-[11px]">
          Hover bars for exact numerical amounts
        </span>

        {trendPoints.length > 0 && (
          <div className="flex items-center gap-2">
            {(() => {
              const lastPt = trendPoints[trendPoints.length - 1]
              const net = lastPt.income - lastPt.expenses
              const isSurplus = net >= 0

              return (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-custom-full flex items-center gap-1 ${
                  isSurplus
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {isSurplus ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  Latest: {isSurplus ? '+' : ''}{formatCurrency(net)}
                </span>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
