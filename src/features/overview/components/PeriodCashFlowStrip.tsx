import React from 'react'
import { formatCurrency as sharedFormatCurrency } from '@/features/financial/utils/formatters'
import { ArrowUpRight, ArrowDownRight, Info } from 'lucide-react'

interface ComparisonResult {
  absoluteChange: number
  percentageChange: number
  direction: 'up' | 'down' | 'unchanged' | 'unavailable'
  comparisonAvailable: boolean
  percentChangeAvailable: boolean
}

interface PeriodCashFlowStripProps {
  income: { [currency: string]: number }
  expenses: { [currency: string]: number }
  savings: { [currency: string]: number }
  savingsRate: { [currency: string]: number }
  incomeCompare: ComparisonResult
  expenseCompare: ComparisonResult
  savingsCompare: ComparisonResult
  primaryCurrency: string
  userLocale: string
  dateRangeLabel: string
}

export const PeriodCashFlowStrip: React.FC<PeriodCashFlowStripProps> = ({
  income,
  expenses,
  savings,
  savingsRate,
  incomeCompare,
  expenseCompare,
  savingsCompare,
  primaryCurrency,
  userLocale,
  dateRangeLabel
}) => {
  const formatCurrency = (val: number, curr?: string) => {
    return sharedFormatCurrency(val, curr || primaryCurrency, userLocale, {
      maximumFractionDigits: 0
    })
  }

  const formatMultiCurrency = (value: { [currency: string]: number }) => {
    const entries = Object.entries(value)
    if (entries.length === 0) return formatCurrency(0)
    if (entries.length === 1) return formatCurrency(entries[0][1], entries[0][0])
    return entries
      .map(([curr, val]) => sharedFormatCurrency(val, curr, userLocale, { maximumFractionDigits: 0 }))
      .join(' | ')
  }

  const formatMultiPercentage = (value: { [currency: string]: number }) => {
    const entries = Object.entries(value)
    if (entries.length === 0) return '0.0%'
    if (entries.length === 1) return `${entries[0][1].toFixed(1)}%`
    return entries.map(([curr, val]) => `${curr}: ${val.toFixed(1)}%`).join(' | ')
  }

  const renderComparisonLabel = (compare: ComparisonResult, isExpense = false) => {
    if (!compare.comparisonAvailable) return null
    const diffVal = formatCurrency(Math.abs(compare.absoluteChange))
    const changeText = compare.percentChangeAvailable
      ? `${compare.direction === 'up' ? '+' : '-'}${compare.percentageChange.toFixed(0)}%`
      : `${compare.direction === 'up' ? '+' : '-'}${diffVal}`

    const isPositiveEffect =
      (compare.direction === 'up' && !isExpense) || (compare.direction === 'down' && isExpense)

    return (
      <div className="flex items-center gap-1 mt-1 text-[11px] font-medium">
        {compare.direction === 'up' && (
          <span className={`${isPositiveEffect ? 'text-state-positive' : 'text-state-expense'} flex items-center gap-0.5`}>
            <ArrowUpRight size={12} /> {changeText}
          </span>
        )}
        {compare.direction === 'down' && (
          <span className={`${isPositiveEffect ? 'text-state-positive' : 'text-state-expense'} flex items-center gap-0.5`}>
            <ArrowDownRight size={12} /> {changeText}
          </span>
        )}
        {compare.direction === 'unchanged' && <span className="text-text-secondary">Unchanged</span>}
        <span className="text-text-muted">vs last period</span>
      </div>
    )
  }

  const primaryIncomeVal = income[primaryCurrency] || 0
  const primaryExpenseVal = expenses[primaryCurrency] || 0
  const primaryNetVal = savings[primaryCurrency] || 0

  // Mid-month / Zero income notice condition
  const isZeroIncomeMidMonth = primaryIncomeVal === 0 && primaryExpenseVal > 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
          Period Cash Flow ({dateRangeLabel})
        </h3>
      </div>

      {/* 4 Flow Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Income Card */}
        <div className="bg-surface-primary border border-border-neutral rounded-custom-lg p-4 shadow-sm">
          <span className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">
            Period Income
          </span>
          <p className="text-base sm:text-lg font-bold text-state-positive mt-1 tabular-nums">
            {formatMultiCurrency(income)}
          </p>
          {renderComparisonLabel(incomeCompare, false)}
        </div>

        {/* Expenses Card */}
        <div className="bg-surface-primary border border-border-neutral rounded-custom-lg p-4 shadow-sm">
          <span className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">
            Period Expenses
          </span>
          <p className="text-base sm:text-lg font-bold text-state-expense mt-1 tabular-nums">
            {formatMultiCurrency(expenses)}
          </p>
          {renderComparisonLabel(expenseCompare, true)}
        </div>

        {/* Net Cash Flow Card */}
        <div className="bg-surface-primary border border-border-neutral rounded-custom-lg p-4 shadow-sm">
          <span className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">
            Net Cash Flow
          </span>
          <p className={`text-base sm:text-lg font-bold mt-1 tabular-nums ${primaryNetVal >= 0 ? 'text-state-positive' : 'text-state-expense'}`}>
            {formatMultiCurrency(savings)}
          </p>
          {renderComparisonLabel(savingsCompare, false)}
        </div>

        {/* Savings Rate Card */}
        <div className="bg-surface-primary border border-border-neutral rounded-custom-lg p-4 shadow-sm">
          <span className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">
            Savings Rate
          </span>
          <p className="text-base sm:text-lg font-bold text-brand-orange mt-1 tabular-nums">
            {formatMultiPercentage(savingsRate)}
          </p>
          <p className="text-[10px] text-text-muted mt-1">
            Percentage of income saved
          </p>
        </div>
      </div>

      {/* Non-alarmist Mid-Month / Zero-Income Explanation Micro-Copy */}
      {isZeroIncomeMidMonth && (
        <div className="bg-surface-secondary/70 border border-border-neutral/60 rounded-custom-lg p-3 flex items-start gap-2 text-xs text-text-secondary">
          <Info size={16} className="text-brand-orange shrink-0 mt-0.5" />
          <p className="leading-normal">
            <strong>Note on Period Net:</strong> Period Net reflects income and expenses recorded during this period ({dateRangeLabel}). Available Funds above reflects the money currently available in your liquid accounts.
          </p>
        </div>
      )}
    </div>
  )
}
