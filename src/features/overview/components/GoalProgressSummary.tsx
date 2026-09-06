import React from 'react'
import { Link } from 'react-router-dom'
import type { Goal, GoalContribution } from '@/features/financial/types'
import { formatCurrency as sharedFormatCurrency } from '@/features/financial/utils/formatters'
import { Target } from 'lucide-react'

interface GoalProgressSummaryProps {
  activeGoals: Goal[]
  goalContributions: { [goalId: string]: GoalContribution[] }
  primaryCurrency: string
  userLocale: string
}

export const GoalProgressSummary: React.FC<GoalProgressSummaryProps> = ({
  activeGoals,
  goalContributions,
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
        <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
          <Target size={18} className="text-brand-orange" /> Goal progress
        </h3>
        <Link to="/goals" className="text-xs font-bold text-brand-orange hover:underline">
          View All
        </Link>
      </div>

      {activeGoals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {activeGoals.slice(0, 4).map((goal) => {
            const contribs = goalContributions[goal.id] || []
            const saved = contribs.reduce((sum, c) => sum + Math.round(c.amount * 100), 0) / 100
            const progress = goal.target_amount > 0 ? (saved / goal.target_amount) * 100 : 0
            const remaining = Math.max(goal.target_amount - saved, 0)

            const dStart = new Date(goal.start_date)
            const dEnd = new Date(goal.target_date)
            const dToday = new Date()
            const totalDuration = dEnd.getTime() - dStart.getTime()

            let pace: 'ahead' | 'on_track' | 'behind' | 'unavailable' = 'unavailable'
            if (totalDuration > 0) {
              const elapsed = Math.min(Math.max(dToday.getTime() - dStart.getTime(), 0), totalDuration)
              const expected = (elapsed / totalDuration) * goal.target_amount
              const diff = saved - expected
              const tolerance = goal.target_amount * 0.02

              if (saved >= goal.target_amount || diff >= tolerance) {
                pace = 'ahead'
              } else if (diff <= -tolerance) {
                pace = 'behind'
              } else {
                pace = 'on_track'
              }
            }

            return (
              <div
                key={goal.id}
                className="space-y-3 bg-surface-secondary/40 border border-border-neutral/50 rounded-custom-lg p-4 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-bold text-text-primary">{goal.name}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-custom-full ${
                        pace === 'ahead'
                          ? 'bg-state-positive/10 text-state-positive'
                          : pace === 'behind'
                          ? 'bg-state-expense/10 text-state-expense'
                          : 'bg-brand-orange/10 text-brand-orange'
                      }`}
                    >
                      {pace === 'ahead' ? 'Ahead' : pace === 'behind' ? 'Behind' : 'On Track'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-text-secondary pt-0.5">
                    <span>Target: {formatCurrency(goal.target_amount)}</span>
                    <span>Saved: {formatCurrency(saved)}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden border border-border-neutral/30">
                    <div
                      className="bg-brand-orange h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-text-muted">
                    <span>{progress.toFixed(0)}% reached</span>
                    <span>{formatCurrency(remaining)} remaining</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="py-6 text-center text-text-secondary text-xs">
          No active savings goals configured yet.
        </div>
      )}
    </div>
  )
}
