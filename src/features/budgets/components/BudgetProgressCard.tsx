import React from 'react'
import { Calendar, ArrowDownRight, ArrowUpRight } from 'lucide-react'

interface BudgetProgressCardProps {
  name: string
  startDate: string
  endDate: string
  limit: number
  spent: number
  remaining: number
  usagePercentage: number
  dailySafeToSpend: number
  projectedSpending: number
  projectedVariance: number
  paceStatus: 'safe' | 'watch' | 'at_risk' | 'exceeded' | 'unavailable'
  daysCounts: { totalDays: number; elapsedDays: number; remainingDays: number }
}

export const BudgetProgressCard: React.FC<BudgetProgressCardProps> = ({
  name,
  startDate,
  endDate,
  limit,
  spent,
  remaining,
  usagePercentage,
  dailySafeToSpend,
  projectedSpending,
  projectedVariance,
  paceStatus,
  daysCounts,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val)
  }

  const getPaceBadgeColor = () => {
    switch (paceStatus) {
      case 'exceeded':
        return 'bg-state-expense/10 text-state-expense border-state-expense/20'
      case 'at_risk':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      case 'watch':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'safe':
        return 'bg-state-positive/10 text-state-positive border-state-positive/20'
      default:
        return 'bg-text-secondary/10 text-text-secondary border-text-secondary/20'
    }
  }

  const getProgressColor = () => {
    if (usagePercentage >= 100) return 'bg-state-expense'
    if (usagePercentage >= 85) return 'bg-amber-500'
    return 'bg-brand-purple'
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    })
  }

  return (
    <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-6 shadow-sm space-y-6">
      
      {/* Title block */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-text-primary">{name}</h2>
          <p className="text-xs text-text-secondary flex items-center gap-1">
            <Calendar size={12} />
            <span>{formatDate(startDate)} – {formatDate(endDate)}</span>
            <span className="mx-1">•</span>
            <span>{daysCounts.remainingDays} days remaining</span>
          </p>
        </div>

        <span className={`text-[10px] font-bold uppercase tracking-wider border px-2.5 py-1 rounded-custom-full ${getPaceBadgeColor()}`}>
          {paceStatus === 'at_risk' ? 'At Risk' : paceStatus}
        </span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left: Remaining / Daily Allowance */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
            Daily Safe to Spend
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-text-primary">
              {formatCurrency(dailySafeToSpend)}
            </span>
            <span className="text-xs text-text-secondary">/ day</span>
          </div>
          <p className="text-xs text-text-secondary">
            {remaining >= 0
              ? `${formatCurrency(remaining)} left in your budget.`
              : `You are overspent by ${formatCurrency(Math.abs(remaining))}.`
            }
          </p>
        </div>

        {/* Center: Total Spent progress bar */}
        <div className="space-y-3 flex flex-col justify-center">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-text-secondary">Spent: {formatCurrency(spent)}</span>
            <span className="text-text-primary">{usagePercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full h-3 bg-surface-secondary rounded-custom-full overflow-hidden">
            <div
              className={`h-full ${getProgressColor()} transition-all duration-500`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-text-secondary font-bold uppercase">
            <span>₹0</span>
            <span>Limit: {formatCurrency(limit)}</span>
          </div>
        </div>

        {/* Right: Projection & variance */}
        <div className="space-y-2 md:pl-6 md:border-l border-border-neutral/60">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
            Surplus / Deficit Projection
          </span>
          
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-text-primary">
              {formatCurrency(projectedSpending)}
            </span>
            <span className="text-xs text-text-secondary">projected</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium">
            {projectedVariance >= 0 ? (
              <span className="text-state-positive flex items-center gap-0.5">
                <ArrowDownRight size={14} /> +{formatCurrency(projectedVariance)} Surplus
              </span>
            ) : (
              <span className="text-state-expense flex items-center gap-0.5">
                <ArrowUpRight size={14} /> -{formatCurrency(Math.abs(projectedVariance))} Deficit
              </span>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
