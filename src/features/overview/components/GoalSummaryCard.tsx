import React, { useMemo } from 'react'
import type { Goal, GoalContribution } from '@/features/financial/types'
import { formatCurrency as sharedFormatCurrency } from '@/features/financial/utils/formatters'
import { calculateGoalSavedAmount, calculateGoalProgressPercentage } from '@/features/financial/utils/calculations'
import { Target, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

interface GoalSummaryCardProps {
  goals: Goal[]
  contributions: { [goalId: string]: GoalContribution[] }
  primaryCurrency?: string
  userLocale?: string
}

// Reusable Circular Progress Ring Component
const CircularProgressRing: React.FC<{ percentage: number; size?: number; strokeWidth?: number }> = ({
  percentage,
  size = 52,
  strokeWidth = 4.5
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clampedPct = Math.min(100, Math.max(0, percentage))
  const strokeDashoffset = circumference - (circumference * clampedPct) / 100

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-surface-secondary"
          fill="transparent"
        />
        {/* Animated Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-brand-orange transition-all duration-700 ease-out"
          fill="transparent"
        />
      </svg>
      {/* Center Percentage Display */}
      <span className="absolute text-[10px] font-extrabold text-text-primary">
        {clampedPct.toFixed(0)}%
      </span>
    </div>
  )
}

export const GoalSummaryCard: React.FC<GoalSummaryCardProps> = ({
  goals,
  contributions,
  primaryCurrency = 'INR',
  userLocale = 'en-IN'
}) => {
  const formatCurrency = (val: number) => {
    return sharedFormatCurrency(val, primaryCurrency, userLocale, {
      maximumFractionDigits: 0
    })
  }

  const activeGoalsList = useMemo(() => {
    const list = (goals || []).filter((g) => g.status === 'active' || !g.status)
    return list.map((g) => {
      const contribs = contributions[g.id] || []
      const saved = calculateGoalSavedAmount(contribs)
      const pct = calculateGoalProgressPercentage(g.target_amount, saved)
      return {
        goal: g,
        saved,
        pct: Math.min(100, Math.max(0, pct))
      }
    }).sort((a, b) => b.pct - a.pct)
  }, [goals, contributions])

  const topGoals = activeGoalsList.slice(0, 2)

  return (
    <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-5 shadow-sm flex flex-col justify-between h-full min-h-[260px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
          <Target size={14} className="text-brand-orange" /> Goal Tracker
        </h3>
        <Link
          to="/planning"
          className="text-xs font-semibold text-brand-orange hover:underline flex items-center gap-1"
        >
          <Plus size={12} /> Add Goal
        </Link>
      </div>

      {/* Goal Items with Circular Progress Rings */}
      {topGoals.length === 0 ? (
        <div className="my-auto py-6 flex flex-col items-center justify-center text-center space-y-2">
          <Target size={32} className="text-text-muted/40 stroke-1" />
          <p className="text-xs font-semibold text-text-secondary">No active goal set</p>
          <Link
            to="/planning"
            className="text-xs font-bold text-brand-orange hover:underline"
          >
            Create Goal +
          </Link>
        </div>
      ) : (
        <div className="space-y-3 my-auto overflow-y-auto max-h-[185px] pr-1">
          {topGoals.map(({ goal, saved, pct }) => (
            <div
              key={goal.id}
              className="flex items-center gap-3 p-3 bg-surface-secondary/40 border border-border-neutral/60 rounded-custom-lg transition-all hover:border-brand-orange/40"
            >
              {/* Circular Progress Indicator */}
              <CircularProgressRing percentage={pct} size={50} strokeWidth={4.5} />

              {/* Goal Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-xs text-text-primary truncate" title={goal.name}>
                    {goal.name}
                  </span>
                  {pct >= 100 && (
                    <span className="text-[10px] bg-state-positive/15 text-state-positive px-1.5 py-0.5 rounded-custom-full font-bold">
                      Achieved
                    </span>
                  )}
                </div>

                <div className="text-[11px] font-mono text-text-muted mt-0.5">
                  <span className="font-bold text-text-primary">{formatCurrency(saved)}</span> / {formatCurrency(goal.target_amount)}
                </div>

                <div className="text-[10px] text-text-secondary mt-0.5 truncate">
                  {pct >= 100
                    ? 'Target achieved 🎉'
                    : `Remaining: ${formatCurrency(Math.max(0, goal.target_amount - saved))}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-border-neutral/30 flex items-center justify-between text-xs text-text-muted mt-2">
        <span>Active Goals: {activeGoalsList.length}</span>
        <Link to="/planning" className="text-brand-orange font-bold hover:underline text-[11px]">
          View All Goals &rarr;
        </Link>
      </div>
    </div>
  )
}
export default GoalSummaryCard
