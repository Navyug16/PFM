import React from 'react'
import { Link } from 'react-router-dom'
import type { Category } from '@/features/financial/types'
import { formatCurrency as sharedFormatCurrency } from '@/features/financial/utils/formatters'

interface CategoryShareItem {
  category: Category | null
  amount: number
  percentage: number
}

interface CategorySpendingCardProps {
  categoryShare: CategoryShareItem[]
  primaryCurrency: string
  userLocale: string
}

export const CategorySpendingCard: React.FC<CategorySpendingCardProps> = ({
  categoryShare,
  primaryCurrency,
  userLocale
}) => {
  const formatCurrency = (val: number, curr?: string) => {
    return sharedFormatCurrency(val, curr || primaryCurrency, userLocale, {
      maximumFractionDigits: 0
    })
  }

  return (
    <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border-neutral/40">
        <h3 className="text-base font-bold text-text-primary">Top Spending Categories</h3>
        <Link to="/transactions?type=expense" className="text-xs font-bold text-brand-orange hover:underline">
          View All
        </Link>
      </div>

      {categoryShare.length > 0 ? (
        <div className="space-y-4 pt-1">
          {categoryShare.slice(0, 5).map((share, idx) => (
            <div key={share.category?.id || idx} className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-text-primary font-semibold">
                  {share.category?.name || 'Uncategorized'}
                </span>
                <div className="space-x-2">
                  <span className="text-text-primary font-bold">{formatCurrency(share.amount)}</span>
                  <span className="text-text-secondary">({share.percentage.toFixed(0)}%)</span>
                </div>
              </div>
              <div className="w-full bg-surface-secondary rounded-full h-2.5 overflow-hidden border border-border-neutral/30">
                <div
                  className="bg-brand-orange h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(share.percentage, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-text-secondary text-xs">
          No expenses recorded in this period.
        </div>
      )}
    </div>
  )
}
