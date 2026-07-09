import React from 'react'
import { calculatePeriodComparison } from '@/features/financial/utils/calculations'
import { formatCurrency } from '@/features/financial/utils/formatters'
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react'

interface ReportSummaryProps {
  income: number
  expenses: number
  savings: number
  savingsRate: number
  prevIncome: number
  prevExpenses: number
  prevSavings: number
  prevSavingsRate: number
}

export const ReportSummary: React.FC<ReportSummaryProps> = ({
  income,
  expenses,
  savings,
  savingsRate,
  prevIncome,
  prevExpenses,
  prevSavings,
  prevSavingsRate
}) => {
  const incomeCompare = calculatePeriodComparison(income, prevIncome)
  const expenseCompare = calculatePeriodComparison(expenses, prevExpenses)
  const savingsCompare = calculatePeriodComparison(savings, prevSavings)

  const renderComparison = (comparison: ReturnType<typeof calculatePeriodComparison>, isExpense = false) => {
    if (!comparison.comparisonAvailable) {
      return (
        <span className="text-[11px] font-semibold text-text-muted flex items-center gap-1">
          <ArrowRight size={12} /> No previous period comparison
        </span>
      )
    }

    if (comparison.percentageChange === 0 && comparison.absoluteChange === 0) {
      return (
        <span className="text-[11px] font-semibold text-text-muted flex items-center gap-1">
          <ArrowRight size={12} /> Unchanged vs previous period
        </span>
      )
    }

    // Zero baseline check
    if (!comparison.percentChangeAvailable) {
      const isUp = comparison.direction === 'up'
      const label = isUp ? 'New income' : 'No previous data'
      const color = isUp ? (isExpense ? 'text-state-expense' : 'text-state-income') : 'text-text-muted'
      return (
        <span className={`text-[11px] font-bold ${color} flex items-center gap-0.5`}>
          {isUp ? <ArrowUpRight size={12} /> : <ArrowRight size={12} />}
          {label} (+{formatCurrency(Math.abs(comparison.absoluteChange))})
        </span>
      )
    }

    const isUp = comparison.direction === 'up'
    const isPositiveChange = isExpense ? !isUp : isUp // Expenses going down is positive; income/savings going up is positive.
    const color = isPositiveChange ? 'text-state-income' : 'text-state-expense'
    const Icon = isUp ? ArrowUpRight : ArrowDownRight
    const directionWord = isUp ? 'more' : 'less'

    return (
      <span className={`text-[11px] font-bold ${color} flex items-center gap-0.5`}>
        <Icon size={12} />
        {comparison.percentageChange.toFixed(0)}% ({formatCurrency(Math.abs(comparison.absoluteChange))} {directionWord})
      </span>
    )
  }

  const rateDiff = savingsRate - prevSavingsRate
  const renderRateComparison = () => {
    if (prevIncome <= 0 && income <= 0) {
      return (
        <span className="text-[11px] font-semibold text-text-muted flex items-center gap-1">
          <ArrowRight size={12} /> No baseline savings rate
        </span>
      )
    }
    const color = rateDiff >= 0 ? 'text-state-income' : 'text-state-expense'
    const Icon = rateDiff >= 0 ? ArrowUpRight : ArrowDownRight
    return (
      <span className={`text-[11px] font-bold ${color} flex items-center gap-0.5`}>
        <Icon size={12} />
        {Math.abs(rateDiff).toFixed(1)}% change in savings rate
      </span>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Income Card */}
      <div className="bg-surface-secondary border border-border-neutral rounded-custom-xl p-5 space-y-2">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
          Total Income
        </span>
        <h3 className="text-2xl font-extrabold text-state-income">
          {formatCurrency(income)}
        </h3>
        <div className="flex items-center gap-1 mt-1">
          {renderComparison(incomeCompare, false)}
        </div>
      </div>

      {/* 2. Expenses Card */}
      <div className="bg-surface-secondary border border-border-neutral rounded-custom-xl p-5 space-y-2">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
          Total Expenses
        </span>
        <h3 className="text-2xl font-extrabold text-state-expense">
          {formatCurrency(expenses)}
        </h3>
        <div className="flex items-center gap-1 mt-1">
          {renderComparison(expenseCompare, true)}
        </div>
      </div>

      {/* 3. Net Savings Card */}
      <div className="bg-surface-secondary border border-border-neutral rounded-custom-xl p-5 space-y-2">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
          Net Savings
        </span>
        <h3 className={`text-2xl font-extrabold ${savings >= 0 ? 'text-text-primary' : 'text-state-expense'}`}>
          {formatCurrency(savings)}
        </h3>
        <div className="flex items-center gap-1 mt-1">
          {renderComparison(savingsCompare, false)}
        </div>
      </div>

      {/* 4. Savings Rate Card */}
      <div className="bg-surface-secondary border border-border-neutral rounded-custom-xl p-5 space-y-2">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
          Savings Rate
        </span>
        <h3 className="text-2xl font-extrabold text-brand-purple">
          {savingsRate.toFixed(1)}%
        </h3>
        <div className="flex items-center gap-1 mt-1">
          {renderRateComparison()}
        </div>
      </div>
    </div>
  )
}
