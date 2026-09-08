import React, { useState } from 'react'
import type { Transaction, Category, Account } from '@/features/financial/types'
import { formatCurrency } from '@/features/financial/utils/formatters'
import { Edit2, DollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'

interface LargestExpensesProps {
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
}

export const LargestExpenses: React.FC<LargestExpensesProps> = ({
  transactions,
  accounts,
  categories
}) => {
  const [limit, setLimit] = useState<5 | 10>(5)

  const accountMap = new Map(accounts.map((a) => [a.id, a.name]))
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]))

  // Filter and sort expense transactions descending
  const expenseTxs = transactions.filter((tx) => tx.transaction_type === 'expense')
  const totalExpenses = expenseTxs.reduce((sum, tx) => sum + tx.amount, 0)
  const largestTxs = expenseTxs.sort((a, b) => b.amount - a.amount).slice(0, limit)

  if (largestTxs.length === 0) {
    return (
      <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-6 text-center space-y-2 shadow-sm flex flex-col justify-center h-full min-h-[320px]">
        <DollarSign size={32} className="mx-auto text-text-muted/40" />
        <h4 className="text-sm font-bold text-text-primary">No expenses recorded</h4>
        <p className="text-xs text-text-secondary max-w-sm mx-auto">
          Log expense transactions in this range to view largest outlay items.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-5 sm:p-6 space-y-4 shadow-sm flex flex-col justify-between h-full min-h-[320px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-border-neutral/40 pb-3">
        <div>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            Largest Outlay Items
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Single largest individual transactions logged in period
          </p>
        </div>

        {/* Limit Toggle */}
        <div className="flex bg-surface-secondary border border-border-neutral rounded-custom-md p-0.5 text-xs font-semibold shrink-0 select-none">
          <button
            type="button"
            onClick={() => setLimit(5)}
            className={`px-3 py-1 rounded-custom-sm transition-all cursor-pointer ${
              limit === 5
                ? 'bg-brand-orange text-white shadow-subtle'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Top 5
          </button>
          <button
            type="button"
            onClick={() => setLimit(10)}
            className={`px-3 py-1 rounded-custom-sm transition-all cursor-pointer ${
              limit === 10
                ? 'bg-brand-orange text-white shadow-subtle'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Top 10
          </button>
        </div>
      </div>

      {/* Item Cards List */}
      <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
        {largestTxs.map((tx, idx) => {
          const categoryName = tx.category_id ? categoryMap.get(tx.category_id) || 'Unknown' : 'Uncategorized'
          const accountName = accountMap.get(tx.account_id) || 'Unknown'
          const sharePct = totalExpenses > 0 ? (tx.amount / totalExpenses) * 100 : 0
          const rank = idx + 1

          return (
            <div
              key={tx.id}
              className="bg-surface-secondary/40 border border-border-neutral/40 rounded-custom-lg p-3.5 space-y-2.5 hover:border-border-neutral/80 transition-all"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Rank Badge */}
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      rank <= 3
                        ? 'bg-brand-orange text-white'
                        : 'bg-surface-secondary text-text-secondary border border-border-neutral'
                    }`}
                  >
                    #{rank}
                  </span>

                  <div className="min-w-0">
                    <span className="text-xs font-extrabold text-text-primary block truncate">
                      {tx.payee_or_source || 'Unspecified Payee'}
                    </span>
                    <span className="text-[10px] text-text-muted block">
                      {tx.transaction_date} • {accountName}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-extrabold text-rose-400 block tabular-nums">
                    -{formatCurrency(tx.amount)}
                  </span>
                  <span className="px-2 py-0.5 bg-surface-primary border border-border-neutral rounded-custom-sm text-[9px] font-semibold text-text-secondary inline-block mt-0.5">
                    {categoryName}
                  </span>
                </div>
              </div>

              {/* Expense Share Bar */}
              <div className="space-y-1 pt-1 border-t border-border-neutral/30">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-text-muted">Outlay Share</span>
                  <span className="font-semibold text-brand-orange">{sharePct.toFixed(1)}% of period expenses</span>
                </div>
                <div className="w-full bg-surface-secondary rounded-full h-1.5 overflow-hidden border border-border-neutral/30">
                  <div
                    className="bg-brand-orange h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(2, sharePct))}%` }}
                  />
                </div>
              </div>

              {/* Action */}
              <div className="flex justify-end pt-0.5">
                <Link
                  to={`/transactions?edit=${tx.id}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-orange hover:underline"
                >
                  <Edit2 size={11} />
                  <span>Edit Transaction</span>
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
