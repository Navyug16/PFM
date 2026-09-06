import React from 'react'
import { formatCurrency as sharedFormatCurrency } from '@/features/financial/utils/formatters'
import { TrendingUp, TrendingDown, Percent } from 'lucide-react'

interface PeriodMetricStackProps {
  periodIncome: { [currency: string]: number }
  periodExpenses: { [currency: string]: number }
  periodSavings: { [currency: string]: number }
  savingsRate: { [currency: string]: number }
  prevPeriodIncome: { [currency: string]: number }
  prevPeriodExpenses: { [currency: string]: number }
  primaryCurrency?: string
  userLocale?: string
}

export const PeriodMetricStack: React.FC<PeriodMetricStackProps> = ({
  periodIncome,
  periodExpenses,
  periodSavings,
  savingsRate,
  prevPeriodIncome,
  prevPeriodExpenses,
  primaryCurrency = 'INR',
  userLocale = 'en-IN'
}) => {
  const formatCurrency = (val: number) => {
    const safeVal = typeof val === 'number' && !isNaN(val) ? val : 0
    return sharedFormatCurrency(safeVal, primaryCurrency, userLocale, {
      maximumFractionDigits: 0
    })
  }

  const income = (periodIncome && periodIncome[primaryCurrency]) || 0
  const expenses = (periodExpenses && periodExpenses[primaryCurrency]) || 0
  const ncf = (periodSavings && periodSavings[primaryCurrency]) || 0
  const sr = (savingsRate && savingsRate[primaryCurrency]) || 0

  const prevInc = (prevPeriodIncome && prevPeriodIncome[primaryCurrency]) || 0
  const prevExp = (prevPeriodExpenses && prevPeriodExpenses[primaryCurrency]) || 0

  const incChange = prevInc > 0 ? ((income - prevInc) / prevInc) * 100 : 0
  const expChange = prevExp > 0 ? ((expenses - prevExp) / prevExp) * 100 : 0

  return (
    <div className="flex flex-col justify-between h-full space-y-3 bg-surface-primary border border-border-neutral rounded-custom-xl p-5 shadow-sm">
      {/* 1. Total Income */}
      <div className="space-y-1">
        <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
          Total Income
        </span>
        <p className="text-xl sm:text-2xl font-extrabold text-emerald-400 tabular-nums tracking-tight">
          +{formatCurrency(income)}
        </p>
        {prevInc > 0 && (
          <span className={`text-[10px] font-bold flex items-center gap-1 ${incChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {incChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(incChange).toFixed(1)}% vs prev period
          </span>
        )}
      </div>

      <div className="border-t border-border-neutral/40" />

      {/* 2. Total Expenses */}
      <div className="space-y-1">
        <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
          Total Expenses
        </span>
        <p className="text-xl sm:text-2xl font-extrabold text-rose-400 tabular-nums tracking-tight">
          -{formatCurrency(expenses)}
        </p>
        {prevExp > 0 && (
          <span className={`text-[10px] font-bold flex items-center gap-1 ${expChange <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {expChange <= 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
            {Math.abs(expChange).toFixed(1)}% vs prev period
          </span>
        )}
      </div>

      <div className="border-t border-border-neutral/40" />

      {/* 3. Net Cash Flow */}
      <div className="space-y-1">
        <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
          Saved / Net Flow
        </span>
        <p className={`text-xl sm:text-2xl font-extrabold tabular-nums tracking-tight ${ncf >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {ncf >= 0 ? '+' : ''}{formatCurrency(ncf)}
        </p>
        <span className="text-[10px] font-bold text-brand-orange flex items-center gap-1">
          <Percent size={12} />
          {sr.toFixed(1)}% savings rate
        </span>
      </div>
    </div>
  )
}
