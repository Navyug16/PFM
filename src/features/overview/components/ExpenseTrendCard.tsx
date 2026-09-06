import React, { useState, useMemo } from 'react'
import type { Transaction, Category, Account } from '@/features/financial/types'
import { formatCurrency as sharedFormatCurrency } from '@/features/financial/utils/formatters'
import { BarChart2 } from 'lucide-react'

export type ExpenseTrendView = 'daily' | 'weekly' | 'monthly' | 'category'

interface ExpenseTrendCardProps {
  transactions: Transaction[]
  categories: Category[]
  accounts: Account[]
  startDate: string
  endDate: string
  primaryCurrency: string
  userLocale: string
}

export const ExpenseTrendCard: React.FC<ExpenseTrendCardProps> = ({
  transactions,
  categories,
  accounts,
  startDate,
  endDate,
  primaryCurrency,
  userLocale
}) => {
  const [viewMode, setViewMode] = useState<ExpenseTrendView>('daily')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const formatCurrency = (val: number) => {
    return sharedFormatCurrency(val, primaryCurrency, userLocale, {
      maximumFractionDigits: 0
    })
  }

  const accountCurrencyMap = useMemo(() => {
    return new Map(accounts.map((a) => [a.id, a.currency_code.toUpperCase()]))
  }, [accounts])

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]))
  }, [categories])

  const expenseTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (tx.transaction_type !== 'expense') return false
      if (accountCurrencyMap.get(tx.account_id) !== primaryCurrency) return false
      return tx.transaction_date >= startDate && tx.transaction_date <= endDate
    })
  }, [transactions, startDate, endDate, accountCurrencyMap, primaryCurrency])

  const totalPeriodExpenses = useMemo(() => {
    return expenseTransactions.reduce((sum, tx) => sum + tx.amount, 0)
  }, [expenseTransactions])

  const timeSeriesData = useMemo(() => {
    if (viewMode === 'category') return []

    const map: { [key: string]: { label: string; amount: number } } = {}

    if (viewMode === 'daily') {
      const dStart = new Date(startDate)
      const dEnd = new Date(endDate)
      const cur = new Date(dStart)
      while (cur <= dEnd) {
        const yyyymmdd = cur.toISOString().split('T')[0]
        const label = cur.toLocaleDateString(userLocale, { month: 'short', day: 'numeric' })
        map[yyyymmdd] = { label, amount: 0 }
        cur.setDate(cur.getDate() + 1)
      }

      expenseTransactions.forEach((tx) => {
        if (map[tx.transaction_date]) {
          map[tx.transaction_date].amount += tx.amount
        }
      })

      return Object.values(map)
    }

    if (viewMode === 'weekly') {
      expenseTransactions.forEach((tx) => {
        const d = new Date(tx.transaction_date)
        const day = d.getDay()
        const diffToMon = day === 0 ? -6 : 1 - day
        const mon = new Date(d)
        mon.setDate(d.getDate() + diffToMon)
        const weekKey = mon.toISOString().split('T')[0]
        const label = `Wk of ${mon.toLocaleDateString(userLocale, { month: 'short', day: 'numeric' })}`
        if (!map[weekKey]) {
          map[weekKey] = { label, amount: 0 }
        }
        map[weekKey].amount += tx.amount
      })
      return Object.values(map).sort((a, b) => a.label.localeCompare(b.label))
    }

    if (viewMode === 'monthly') {
      expenseTransactions.forEach((tx) => {
        const d = new Date(tx.transaction_date)
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const label = d.toLocaleDateString(userLocale, { month: 'short', year: '2-digit' })
        if (!map[monthKey]) {
          map[monthKey] = { label, amount: 0 }
        }
        map[monthKey].amount += tx.amount
      })
      return Object.values(map).sort((a, b) => a.label.localeCompare(b.label))
    }

    return []
  }, [expenseTransactions, startDate, endDate, viewMode, userLocale])

  const categoryData = useMemo(() => {
    if (viewMode !== 'category') return []

    const map: { [catId: string]: number } = {}
    expenseTransactions.forEach((tx) => {
      const catId = tx.category_id || 'uncategorized'
      map[catId] = (map[catId] || 0) + tx.amount
    })

    const items = Object.entries(map).map(([catId, amount]) => {
      const category = categoryMap.get(catId) || null
      const percentage = totalPeriodExpenses > 0 ? (amount / totalPeriodExpenses) * 100 : 0
      return {
        id: catId,
        name: category ? category.name : 'Uncategorized',
        amount,
        percentage
      }
    })

    return items.sort((a, b) => b.amount - a.amount)
  }, [expenseTransactions, categoryMap, totalPeriodExpenses, viewMode])

  const maxTimeSeriesVal = useMemo(() => {
    return Math.max(...timeSeriesData.map((d) => d.amount), 1)
  }, [timeSeriesData])

  return (
    <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-5 shadow-sm flex flex-col justify-between h-full min-h-[290px]">
      {/* Top Bar: Headline & Controls matching ACRU Dashboard reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              {formatCurrency(totalPeriodExpenses)}
            </h2>
          </div>
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mt-0.5">
            Expense Trend
          </span>
        </div>

        {/* View Selector Tabs */}
        <div className="flex items-center bg-surface-secondary border border-border-neutral rounded-custom-md p-1 self-start sm:self-auto shrink-0">
          {(['daily', 'weekly', 'monthly', 'category'] as ExpenseTrendView[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-xs font-semibold rounded-custom-sm capitalize transition-all cursor-pointer ${
                viewMode === mode
                  ? 'bg-brand-orange text-white shadow-sm font-bold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-primary/50'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart Content */}
      <div className="flex-1 flex flex-col justify-center my-auto min-h-[190px]">
        {expenseTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-text-muted space-y-2">
            <BarChart2 size={32} className="text-text-muted/40 stroke-1" />
            <p className="text-xs font-semibold text-text-secondary">No expense transactions recorded for this period</p>
          </div>
        ) : viewMode === 'category' ? (
          <div className="space-y-3 py-1 overflow-y-auto max-h-[200px] pr-1">
            {categoryData.map((item) => (
              <div key={item.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-text-primary truncate max-w-[180px]">
                    {item.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-text-secondary text-[11px]">
                      {item.percentage.toFixed(1)}%
                    </span>
                    <span className="font-bold text-text-primary tabular-nums">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-surface-secondary h-2 rounded-full overflow-hidden border border-border-neutral/40">
                  <div
                    className="bg-brand-orange h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(2, item.percentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col justify-end h-[180px] w-full pt-4">
            <div className="flex items-end justify-between gap-1.5 h-full w-full border-b border-border-neutral/50 pb-2">
              {timeSeriesData.map((d, idx) => {
                const heightPct = maxTimeSeriesVal > 0 ? (d.amount / maxTimeSeriesVal) * 100 : 0
                const isHovered = hoveredIndex === idx

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {isHovered && d.amount > 0 && (
                      <div className="absolute -top-10 z-30 bg-surface-secondary border border-brand-orange/40 text-text-primary px-2.5 py-1 rounded-custom-md text-[10px] font-bold shadow-elevated whitespace-nowrap pointer-events-none">
                        <span>{d.label}: </span>
                        <span className="text-brand-orange font-extrabold">{formatCurrency(d.amount)}</span>
                      </div>
                    )}
                    <div
                      className={`w-full max-w-[28px] rounded-t transition-all duration-300 ${
                        isHovered || d.amount === maxTimeSeriesVal
                          ? 'bg-brand-orange shadow-sm'
                          : d.amount > 0
                          ? 'bg-brand-orange/70 hover:bg-brand-orange'
                          : 'bg-surface-secondary/60'
                      }`}
                      style={{ height: `${Math.max(4, heightPct)}%` }}
                    />
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between text-[10px] font-medium text-text-muted pt-2 px-1">
              <span>{timeSeriesData[0]?.label || ''}</span>
              {timeSeriesData.length > 2 && (
                <span>{timeSeriesData[Math.floor(timeSeriesData.length / 2)]?.label || ''}</span>
              )}
              <span>{timeSeriesData[timeSeriesData.length - 1]?.label || ''}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
