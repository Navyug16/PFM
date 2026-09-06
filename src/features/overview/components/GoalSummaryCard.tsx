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
    const list = (goals || []).filter((g) => g.status === 'in_progress')
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

  const top2Goals = activeGoalsList.slice(0, 3)

  return (
    <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-5 shadow-sm flex flex-col justify-between h-full min-h-[260px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
          Goal Tracker
        </h3>
        <Link
          to="/planning"
          className="text-xs font-semibold text-brand-orange hover:underline flex items-center gap-1"
        >
          <Plus size={12} /> Add Goals
        </Link>
      </div>

      {/* Goal Items */}
      {top2Goals.length === 0 ? (
        <div className="my-auto py-6 flex flex-col items-center justify-center text-center space-y-2">
          <Target size={28} className="text-text-muted/40 stroke-1" />
          <p className="text-xs font-semibold text-text-secondary">No active goal set</p>
          <Link
            to="/planning"
            className="text-xs font-bold text-brand-orange hover:underline"
          >
            Create Goal +
          </Link>
        </div>
      ) : (
        <div className="space-y-3 my-auto overflow-y-auto max-h-[170px] pr-1">
          {top2Goals.map(({ goal, saved, pct }) => (
            <div key={goal.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-text-primary truncate max-w-[130px]">
                  {goal.name}
                </span>
                <span className="font-mono text-text-muted text-[11px]">
                  <span className="font-bold text-text-primary">{formatCurrency(saved)}</span> / {formatCurrency(goal.target_amount)}
                </span>
              </div>
              <div className="w-full bg-surface-secondary h-2 rounded-full overflow-hidden border border-border-neutral/30">
                <div
                  className="bg-brand-orange h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(2, pct)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>{pct.toFixed(0)}% saved</span>
                <span className="text-brand-orange font-semibold">
                  {pct >= 100 ? 'Target Achieved 🎉' : `Left: ${formatCurrency(Math.max(0, goal.target_amount - saved))}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 border-t border-border-neutral/30 flex items-center justify-between text-xs text-text-muted">
        <span>Active Goals: {activeGoalsList.length}</span>
        <Link to="/planning" className="text-brand-orange font-bold hover:underline text-[11px]">
          View Goals &rarr;
        </Link>
      </div>
    </div>
  )
}
