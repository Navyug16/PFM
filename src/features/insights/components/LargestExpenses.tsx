import React, { useState } from 'react'
import type { Transaction, Category, Account } from '@/features/financial/types'
import { formatCurrency } from '@/features/financial/utils/formatters'
import { Edit2 } from 'lucide-react'
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

  // Filter and sort expenses descending
  const largestTxs = transactions
    .filter((tx) => tx.transaction_type === 'expense')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit)

  if (largestTxs.length === 0) {
    return (
      <div className="bg-surface-secondary border border-border-neutral rounded-custom-xl p-6 text-center space-y-2">
        <h4 className="text-sm font-bold text-text-primary">No expenses recorded</h4>
        <p className="text-xs text-text-secondary max-w-sm mx-auto">
          Log expense transactions in this range to view largest outlays.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-surface-secondary border border-border-neutral rounded-custom-xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-border-neutral pb-2">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
          Largest Outlay Items
        </h3>
        <div className="flex bg-surface-primary border border-border-neutral rounded-custom-md p-0.5 text-xs font-semibold shrink-0 select-none">
          <button
            onClick={() => setLimit(5)}
            className={`px-3 py-1.5 rounded-custom-sm transition-all cursor-pointer ${
              limit === 5 ? 'bg-brand-purple text-text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Top 5
          </button>
          <button
            onClick={() => setLimit(10)}
            className={`px-3 py-1.5 rounded-custom-sm transition-all cursor-pointer ${
              limit === 10 ? 'bg-brand-purple text-text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Top 10
          </button>
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="space-y-3 sm:hidden">
        {largestTxs.map((tx) => {
          const categoryName = tx.category_id ? categoryMap.get(tx.category_id) || 'Unknown' : 'Uncategorized'
          const accountName = accountMap.get(tx.account_id) || 'Unknown'

          return (
            <div
              key={tx.id}
              className="bg-surface-primary border border-border-neutral/60 rounded-custom-lg p-3.5 space-y-2 font-medium"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-text-secondary block">
                    {tx.transaction_date}
                  </span>
                  <span className="text-xs font-extrabold text-text-primary block">
                    {tx.payee_or_source || 'Unspecified'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-text-primary block">
                    {formatCurrency(tx.amount)}
                  </span>
                  <span className="px-2 py-0.5 bg-surface-secondary border border-border-neutral rounded-full text-[9px] text-text-secondary inline-block mt-1">
                    {categoryName}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-border-neutral/20 text-[10px] text-text-secondary">
                <span>Account: {accountName}</span>
                <Link
                  to={`/transactions?edit=${tx.id}`}
                  className="inline-flex items-center gap-0.5 text-brand-purple hover:underline font-bold"
                >
                  <Edit2 size={10} />
                  <span>Edit</span>
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="text-text-secondary border-b border-border-neutral font-semibold">
              <th className="pb-2.5">Date</th>
              <th className="pb-2.5">Payee / Source</th>
              <th className="pb-2.5">Category</th>
              <th className="pb-2.5 hidden md:table-cell">Account</th>
              <th className="pb-2.5 text-right">Amount</th>
              <th className="pb-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {largestTxs.map((tx) => {
              const categoryName = tx.category_id ? categoryMap.get(tx.category_id) || 'Unknown' : 'Uncategorized'
              const accountName = accountMap.get(tx.account_id) || 'Unknown'

              return (
                <tr key={tx.id} className="border-b border-border-neutral/40 hover:bg-surface-primary/30 transition-all font-medium">
                  <td className="py-3 text-text-secondary">{tx.transaction_date}</td>
                  <td className="py-3 text-text-primary font-bold">
                    {tx.payee_or_source || 'Unspecified'}
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 bg-surface-primary border border-border-neutral rounded-full text-[10px] text-text-secondary">
                      {categoryName}
                    </span>
                  </td>
                  <td className="py-3 text-text-secondary hidden md:table-cell">{accountName}</td>
                  <td className="py-3 text-right font-extrabold text-text-primary">
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      to={`/transactions?edit=${tx.id}`}
                      className="inline-flex items-center gap-1 text-brand-purple hover:underline"
                    >
                      <Edit2 size={12} />
                      <span className="hidden sm:inline">Edit</span>
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
