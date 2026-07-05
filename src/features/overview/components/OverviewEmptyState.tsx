import React from 'react'
import { Wallet, Landmark, TrendingUp, Target, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface OverviewEmptyStateProps {
  type: 'no_accounts' | 'no_transactions' | 'no_period_expenses' | 'no_goals'
  onQuickAction?: () => void
}

export const OverviewEmptyState: React.FC<OverviewEmptyStateProps> = ({
  type,
  onQuickAction
}) => {
  if (type === 'no_accounts') {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-surface-primary border border-border-neutral rounded-custom-xl max-w-lg mx-auto mt-12 space-y-6">
        <div className="p-4 bg-brand-purple/10 rounded-full text-brand-purple">
          <Landmark size={36} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-text-primary">Create Your First Account</h3>
          <p className="text-text-secondary text-sm max-w-sm">
            To start tracking your net position and Available Balance, you need to add an account (checking, savings, cash, etc.).
          </p>
        </div>
        <Link
          to="/accounts"
          className="px-5 py-2.5 bg-brand-purple hover:bg-brand-purple/90 text-text-primary font-semibold text-sm rounded-custom-md flex items-center gap-2 transition-all cursor-pointer"
        >
          Manage Accounts <ArrowRight size={16} />
        </Link>
      </div>
    )
  }

  if (type === 'no_transactions') {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-surface-primary border border-border-neutral rounded-custom-xl max-w-lg mx-auto mt-12 space-y-6">
        <div className="p-4 bg-brand-purple/10 rounded-full text-brand-purple">
          <Wallet size={36} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-text-primary">Log Your First Transaction</h3>
          <p className="text-text-secondary text-sm max-w-sm">
            Your account is set up! Add your first income, expense, or transfer entry to see analytics and intelligence.
          </p>
        </div>
        {onQuickAction ? (
          <button
            onClick={onQuickAction}
            className="px-5 py-2.5 bg-brand-purple hover:bg-brand-purple/90 text-text-primary font-semibold text-sm rounded-custom-md flex items-center gap-2 transition-all cursor-pointer"
          >
            Add Transaction <ArrowRight size={16} />
          </button>
        ) : (
          <Link
            to="/transactions"
            className="px-5 py-2.5 bg-brand-purple hover:bg-brand-purple/90 text-text-primary font-semibold text-sm rounded-custom-md flex items-center gap-2 transition-all cursor-pointer"
          >
            Go to Transactions <ArrowRight size={16} />
          </Link>
        )}
      </div>
    )
  }

  if (type === 'no_period_expenses') {
    return (
      <div className="flex flex-col items-center justify-center text-center p-6 bg-surface-primary/40 border border-border-neutral/60 rounded-custom-xl space-y-3">
        <div className="p-3 bg-text-muted/10 rounded-full text-text-secondary">
          <TrendingUp size={24} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-text-primary">No Expenses Recorded</p>
          <p className="text-xs text-text-secondary max-w-xs">
            There are no expense records logged in the selected period to display category spending breakdown.
          </p>
        </div>
      </div>
    )
  }

  if (type === 'no_goals') {
    return (
      <div className="flex flex-col items-center justify-center text-center p-6 bg-surface-primary/40 border border-border-neutral/60 rounded-custom-xl space-y-3">
        <div className="p-3 bg-brand-purple/10 rounded-full text-brand-purple">
          <Target size={24} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-text-primary">No Active Goals</p>
          <p className="text-xs text-text-secondary max-w-xs mb-2">
            You don't have any active savings goals. Set goals to track progress and keep pacing on track.
          </p>
        </div>
        <Link
          to="/goals"
          className="text-xs font-bold text-brand-purple hover:underline flex items-center gap-1 cursor-pointer"
        >
          Create Savings Goal <ArrowRight size={12} />
        </Link>
      </div>
    )
  }

  return null
}
