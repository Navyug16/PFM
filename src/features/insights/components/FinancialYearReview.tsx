import React from 'react'
import type { IndianFYReview } from '../utils/report-calculations'
import { formatCurrency } from '@/features/financial/utils/formatters'
import { Calendar, Target } from 'lucide-react'

interface FinancialYearReviewProps {
  fyReview: IndianFYReview | null
  fyStart: string
  fyEnd: string
}

export const FinancialYearReview: React.FC<FinancialYearReviewProps> = ({
  fyReview,
  fyStart,
  fyEnd
}) => {
  if (!fyReview) return null

  return (
    <div className="bg-surface-secondary border border-border-neutral rounded-custom-xl p-5 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-border-neutral pb-3">
        <div>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <Calendar size={18} className="text-brand-purple" />
            <span>Indian Financial Year Review</span>
          </h3>
          <p className="text-[11px] text-text-secondary mt-0.5">
            FY Span: {fyStart} to {fyEnd}
          </p>
        </div>
      </div>

      {/* 1. Core Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-primary border border-border-neutral rounded-custom-lg p-4 space-y-1">
          <span className="text-[10px] font-bold text-text-secondary uppercase">FY Income</span>
          <p className="text-lg font-extrabold text-state-income">{formatCurrency(fyReview.income)}</p>
        </div>

        <div className="bg-surface-primary border border-border-neutral rounded-custom-lg p-4 space-y-1">
          <span className="text-[10px] font-bold text-text-secondary uppercase">FY Expenses</span>
          <p className="text-lg font-extrabold text-state-expense">{formatCurrency(fyReview.expenses)}</p>
        </div>

        <div className="bg-surface-primary border border-border-neutral rounded-custom-lg p-4 space-y-1">
          <span className="text-[10px] font-bold text-text-secondary uppercase">FY Net Savings</span>
          <p className={`text-lg font-extrabold ${fyReview.savings >= 0 ? 'text-text-primary' : 'text-state-expense'}`}>
            {formatCurrency(fyReview.savings)}
          </p>
        </div>

        <div className="bg-surface-primary border border-border-neutral rounded-custom-lg p-4 space-y-1">
          <span className="text-[10px] font-bold text-text-secondary uppercase">FY Savings Rate</span>
          <p className="text-lg font-extrabold text-brand-purple">{fyReview.savingsRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* 2. Key Observations and Extremes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider block border-b border-border-neutral/60 pb-1.5">
            Month extremes & Category stats
          </h4>
          <div className="space-y-2 text-xs font-medium">
            <div className="flex justify-between py-2 border-b border-border-neutral/30">
              <span className="text-text-secondary">Highest-Spending Month:</span>
              <span className="text-text-primary font-bold">{fyReview.highestSpendingMonth}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border-neutral/30">
              <span className="text-text-secondary">Lowest-Spending Month:</span>
              <span className="text-text-primary font-bold">{fyReview.lowestSpendingMonth}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border-neutral/30">
              <span className="text-text-secondary">Best Savings Month:</span>
              <span className="text-text-primary font-bold">{fyReview.bestSavingsMonth}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border-neutral/30">
              <span className="text-text-secondary">Largest Outlays Category:</span>
              <span className="text-text-primary font-bold">{fyReview.largestCategory}</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-primary border border-border-neutral rounded-custom-lg p-5 flex flex-col justify-center space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-purple/10 text-brand-purple rounded-full">
              <Target size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">FY Goal Contributions</h4>
              <p className="text-xs text-text-secondary mt-0.5">
                Total allocations diverted to active saving targets this financial year.
              </p>
            </div>
          </div>
          <div className="border-t border-border-neutral pt-3">
            <span className="text-xs font-semibold text-text-secondary block">Total FY Contributions</span>
            <span className="text-2xl font-extrabold text-brand-purple mt-0.5 block">
              {formatCurrency(fyReview.totalGoalContributions)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
