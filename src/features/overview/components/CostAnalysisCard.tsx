import React, { useMemo } from 'react'
import type { Category, Transaction, Account } from '@/features/financial/types'
import { formatCurrency as sharedFormatCurrency } from '@/features/financial/utils/formatters'
import { calculateCategorySpending, calculateCategoryShare } from '@/features/financial/utils/calculations'


interface CostAnalysisCardProps {
  transactions: Transaction[]
  categories: Category[]
  accounts: Account[]
  startDate: string
  endDate: string
  primaryCurrency?: string
  userLocale?: string
}

export const CostAnalysisCard: React.FC<CostAnalysisCardProps> = ({
  transactions,
  categories,
  accounts,
  startDate,
  endDate,
  primaryCurrency = 'INR',
  userLocale = 'en-IN'
}) => {
  const formatCurrency = (val: number) => {
    return sharedFormatCurrency(val, primaryCurrency, userLocale, {
      maximumFractionDigits: 0
    })
  }

  const accountCurrencyMap = useMemo(() => {
    return new Map(accounts.map((a) => [a.id, a.currency_code.toUpperCase()]))
  }, [accounts])

  const primaryTransactions = useMemo(() => {
    return transactions.filter(
      (tx) => accountCurrencyMap.get(tx.account_id) === primaryCurrency
    )
  }, [transactions, accountCurrencyMap, primaryCurrency])

  const categorySpending = useMemo(() => {
    return calculateCategorySpending(primaryTransactions, startDate, endDate)
  }, [primaryTransactions, startDate, endDate])

  const totalExpense = useMemo(() => {
    return Object.values(categorySpending).reduce((a, b) => a + b, 0)
  }, [categorySpending])

  const sortedCategories = useMemo(() => {
    const categoryMap = new Map(categories.map((c) => [c.id, c]))
    return Object.entries(categorySpending)
      .map(([catId, amount]) => {
        const category = categoryMap.get(catId) || null
        const percentage = calculateCategoryShare(amount, totalExpense)
        return {
          id: catId,
          name: category ? category.name : 'Uncategorized',
          amount,
          percentage
        }
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  }, [categorySpending, categories, totalExpense])

  const segmentColors = ['bg-brand-orange', 'bg-amber-500', 'bg-emerald-500', 'bg-sky-500', 'bg-purple-500']

  return (
    <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-5 shadow-sm flex flex-col justify-between h-full min-h-[260px]">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
          Cost Analysis
        </h3>
        <span className="text-[10px] font-semibold text-text-muted">Spending Overview</span>
      </div>

      {/* Amount Headline */}
      <div className="my-1">
        <p className="text-2xl font-extrabold text-text-primary tabular-nums tracking-tight">
          {formatCurrency(totalExpense)}
        </p>
      </div>

      {/* Multi-Segment Progress Bar */}
      <div className="w-full h-2.5 bg-surface-secondary rounded-full overflow-hidden flex my-2 border border-border-neutral/30">
        {sortedCategories.map((cat, idx) => (
          <div
            key={cat.id}
            className={`${segmentColors[idx % segmentColors.length]} h-full`}
            style={{ width: `${Math.max(1, cat.percentage)}%` }}
            title={`${cat.name}: ${cat.percentage.toFixed(0)}%`}
          />
        ))}
      </div>

      {/* Category List with Percentages */}
      {sortedCategories.length === 0 ? (
        <div className="my-auto text-center py-4 text-xs text-text-muted">
          No category expenses for this period
        </div>
      ) : (
        <div className="space-y-1.5 my-auto overflow-y-auto max-h-[140px] pr-1">
          {sortedCategories.map((cat, idx) => (
            <div key={cat.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2 h-2 rounded-full ${segmentColors[idx % segmentColors.length]} shrink-0`} />
                <span className="font-semibold text-text-secondary truncate max-w-[110px]">
                  {cat.name}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-[11px] font-bold text-text-primary">
                  {cat.percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
