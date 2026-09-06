import React from 'react'
import type { Transaction } from '@/features/financial/types'
import { formatCurrency as sharedFormatCurrency } from '@/features/financial/utils/formatters'
import { Clock, Plus, Minus, ArrowLeftRight } from 'lucide-react'

interface TodayGlanceCardProps {
  todayExpenses: { [currency: string]: number }
  todayCount: number
  dailyAverage: { [currency: string]: number }
  todayMaxExpense: Transaction | null
  onQuickAdd: (type: 'expense' | 'income' | 'transfer') => void
  primaryCurrency: string
  userLocale: string
}

export const TodayGlanceCard: React.FC<TodayGlanceCardProps> = ({
  todayExpenses,
  todayCount,
  dailyAverage,
  todayMaxExpense,
  onQuickAdd,
  primaryCurrency,
  userLocale
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

  return (
    <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-6 shadow-sm flex flex-col justify-between space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Clock size={16} className="text-brand-orange" /> Today at a glance
          </h3>
          <span className="text-xs text-text-secondary">Quick Activity</span>
        </div>

        <div className="grid grid-cols-3 gap-4 py-4 my-2 border-y border-border-neutral/40">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
              Spent Today
            </span>
            <p className="text-base sm:text-lg font-bold text-text-primary tabular-nums">
              {formatMultiCurrency(todayExpenses)}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
              Entries
            </span>
            <p className="text-base sm:text-lg font-bold text-text-primary tabular-nums">
              {todayCount}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
              Daily Average
            </span>
            <p className="text-base sm:text-lg font-bold text-text-secondary tabular-nums">
              {formatMultiCurrency(dailyAverage)}
            </p>
          </div>
        </div>

        <div className="text-xs text-text-secondary">
          {todayMaxExpense ? (
            <p>
              Largest today: <strong className="text-state-expense font-bold">{formatCurrency(todayMaxExpense.amount)}</strong> for "{todayMaxExpense.payee_or_source}"
            </p>
          ) : (
            <p>No expenses logged today yet.</p>
          )}
        </div>
      </div>

      {/* Quick Action Log Buttons */}
      <div className="pt-2 border-t border-border-neutral/30">
        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-2">
          Quick Actions
        </span>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onQuickAdd('expense')}
            className="py-2 px-3 bg-state-expense/10 hover:bg-state-expense/15 text-state-expense font-semibold text-xs rounded-custom-md transition-all cursor-pointer flex items-center justify-center gap-1 border border-state-expense/20"
          >
            <Minus size={14} /> Expense
          </button>
          <button
            onClick={() => onQuickAdd('income')}
            className="py-2 px-3 bg-state-positive/10 hover:bg-state-positive/15 text-state-positive font-semibold text-xs rounded-custom-md transition-all cursor-pointer flex items-center justify-center gap-1 border border-state-positive/20"
          >
            <Plus size={14} /> Income
          </button>
          <button
            onClick={() => onQuickAdd('transfer')}
            className="py-2 px-3 bg-brand-orange/10 hover:bg-brand-orange/15 text-brand-orange font-semibold text-xs rounded-custom-md transition-all cursor-pointer flex items-center justify-center gap-1 border border-brand-orange/20"
          >
            <ArrowLeftRight size={13} /> Transfer
          </button>
        </div>
      </div>
    </div>
  )
}
