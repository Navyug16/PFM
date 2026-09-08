import React, { useMemo } from 'react'
import type { Transaction, Category, Account } from '@/features/financial/types'
import { formatCurrency as sharedFormatCurrency } from '@/features/financial/utils/formatters'
import { ArrowUpRight, ArrowDownRight, ArrowRightLeft, Receipt } from 'lucide-react'
import { Link } from 'react-router-dom'

interface RecentTransactionsCardProps {
  transactions: Transaction[]
  categories: Category[]
  accounts: Account[]
  primaryCurrency?: string
  userLocale?: string
}

export const RecentTransactionsCard: React.FC<RecentTransactionsCardProps> = ({
  transactions,
  categories,
  accounts,
  primaryCurrency = 'INR',
  userLocale = 'en-IN'
}) => {
  const formatCurrency = (val: number, curr?: string) => {
    return sharedFormatCurrency(val, curr || primaryCurrency, userLocale, {
      maximumFractionDigits: 0
    })
  }

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c.name]))
  }, [categories])

  const accountMap = useMemo(() => {
    return new Map(accounts.map((a) => [a.id, a]))
  }, [accounts])

  const recent5 = useMemo(() => {
    return (transactions || [])
      .slice()
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
      .slice(0, 5)
  }, [transactions])

  return (
    <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-5 shadow-sm flex flex-col justify-between h-full min-h-[260px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
          Transaction History
        </h3>
        <Link
          to="/transactions"
          className="text-xs font-semibold text-brand-orange hover:underline"
        >
          View All &rarr;
        </Link>
      </div>

      {/* Transaction List */}
      {recent5.length === 0 ? (
        <div className="my-auto py-6 flex flex-col items-center justify-center text-center space-y-2">
          <Receipt size={28} className="text-text-muted/40 stroke-1" />
          <p className="text-xs font-medium text-text-secondary">No transactions logged yet</p>
        </div>
      ) : (
        <div className="space-y-2 my-auto overflow-y-auto max-h-[180px] pr-1">
          {recent5.map((tx) => {
            const isIncome = tx.transaction_type === 'income'
            const isTransfer = tx.transaction_type === 'transfer'
            const categoryName = categoryMap.get(tx.category_id || '') || 'Uncategorized'
            const acc = accountMap.get(tx.account_id)
            const currency = acc?.currency_code || primaryCurrency

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-2 rounded-custom-md bg-surface-secondary/40 border border-border-neutral/30 hover:border-border-neutral/70 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      isIncome
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : isTransfer
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowUpRight size={13} />
                    ) : isTransfer ? (
                      <ArrowRightLeft size={13} />
                    ) : (
                      <ArrowDownRight size={13} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-text-primary truncate">
                      {tx.notes || tx.payee_or_source || categoryName}
                    </p>
                    <span className="text-[10px] text-text-muted block">
                      {new Date(tx.transaction_date).toLocaleDateString(userLocale, {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p
                    className={`text-xs font-extrabold tabular-nums tracking-tight ${
                      isIncome
                        ? 'text-emerald-400'
                        : isTransfer
                        ? 'text-text-primary'
                        : 'text-text-primary'
                    }`}
                  >
                    {isIncome ? '+' : isTransfer ? '' : '-'}
                    {formatCurrency(tx.amount, currency)}
                  </p>
                  <span className="text-[9px] font-semibold text-text-muted capitalize block">
                    Completed
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
