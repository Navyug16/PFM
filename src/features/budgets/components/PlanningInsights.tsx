import React from 'react'
import { Sparkles, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react'
import type { CategoryBudgetDetails } from '../hooks/useBudgetData'

interface PlanningInsightsProps {
  spent: number
  limit: number
  remaining: number
  dailySafeToSpend: number
  projectedVariance: number
  paceStatus: string
  remainingDays: number
  categoryBreakdown: CategoryBudgetDetails[]
  uncategorizedSpending: number
}

export const PlanningInsights: React.FC<PlanningInsightsProps> = ({
  spent,
  limit,
  remaining,
  dailySafeToSpend,
  projectedVariance,
  paceStatus,
  remainingDays,
  categoryBreakdown,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val)
  }

  // Generate insights list
  const insights: {
    id: string
    question: string
    answer: string
    priority: number
    type: 'positive' | 'negative' | 'neutral'
  }[] = []

  // 1. Daily Safe-to-Spend Insight
  if (spent > limit) {
    insights.push({
      id: 'insight-daily-safe',
      question: 'Can I safely spend more today?',
      answer: `**No discretionary allowance remaining**. You have exceeded your overall budget limit by ${formatCurrency(Math.abs(remaining))}.`,
      priority: 7,
      type: 'negative',
    })
  } else {
    insights.push({
      id: 'insight-daily-safe',
      question: 'Can I safely spend more today?',
      answer: `**Yes, you can safely spend ${formatCurrency(dailySafeToSpend)} today**. Keeping to this pace for the remaining ${remainingDays} days keeps you under limit.`,
      priority: 2,
      type: 'positive',
    })
  }

  // 2. Budget projection & variance
  if (spent > limit) {
    // Already exceeded
  } else if (paceStatus === 'at_risk') {
    insights.push({
      id: 'insight-projection',
      question: 'What should I focus on now?',
      answer: `**Reduce discretionary spending**. Your current run rate is projected to exceed the budget by ${formatCurrency(Math.abs(projectedVariance))} by the end of the period.`,
      priority: 6,
      type: 'negative',
    })
  } else if (paceStatus === 'watch') {
    insights.push({
      id: 'insight-projection',
      question: 'What should I focus on now?',
      answer: `**Watch your spending pace**. You are projected to exceed the budget slightly by ${formatCurrency(Math.abs(projectedVariance))}.`,
      priority: 4,
      type: 'neutral',
    })
  } else {
    insights.push({
      id: 'insight-projection',
      question: 'What should I focus on now?',
      answer: `**You are doing great!** You are projected to finish the month with a surplus of ${formatCurrency(projectedVariance)}.`,
      priority: 1,
      type: 'positive',
    })
  }

  // 3. Category attention
  if (categoryBreakdown.length > 0) {
    // Sort to find the highest usage percentage category
    const sortedCats = [...categoryBreakdown].sort((a, b) => b.usagePercentage - a.usagePercentage)
    const topCat = sortedCats[0]

    if (topCat.usagePercentage > 100) {
      insights.push({
        id: 'insight-category-attention',
        question: 'Which category needs immediate attention?',
        answer: `**${topCat.categoryName} is over budget**. You have spent ${formatCurrency(topCat.spent)}, exceeding its allocation by ${formatCurrency(topCat.spent - topCat.allocated)}.`,
        priority: 5,
        type: 'negative',
      })
    } else if (topCat.usagePercentage >= 80) {
      insights.push({
        id: 'insight-category-attention',
        question: 'Which category needs attention?',
        answer: `**${topCat.categoryName} has used ${topCat.usagePercentage.toFixed(0)}% of its limit** with ${remainingDays} days remaining. Keep spending on hold here.`,
        priority: 3,
        type: 'neutral',
      })
    } else {
      insights.push({
        id: 'insight-category-attention',
        question: 'Are my categories on track?',
        answer: `**All categories are under limit**. ${topCat.categoryName} is your highest usage at ${topCat.usagePercentage.toFixed(0)}%.`,
        priority: 1,
        type: 'positive',
      })
    }
  }

  // Sort by priority score descending
  const sortedInsights = [...insights].sort((a, b) => b.priority - a.priority)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-brand-purple" />
        <h3 className="text-base font-bold text-text-primary">Planning Insights</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sortedInsights.map((ins) => (
          <div
            key={ins.id}
            className="bg-surface-primary border border-border-neutral rounded-custom-xl p-5 shadow-sm flex flex-col justify-between"
          >
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
                {ins.question}
              </span>
              <p className="text-sm font-medium text-text-primary leading-relaxed">
                {/* Parse Bold templates manually */}
                {ins.answer.includes('**') ? (
                  <>
                    <strong className="font-bold text-text-primary">
                      {ins.answer.split('**')[1]}
                    </strong>
                    {ins.answer.split('**')[2]}
                  </>
                ) : (
                  ins.answer
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border-neutral/40">
              {ins.type === 'positive' ? (
                <span className="text-state-positive flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-state-positive/10 px-2 py-0.5 rounded-custom-full">
                  <CheckCircle size={12} /> On Track
                </span>
              ) : ins.type === 'negative' ? (
                <span className="text-state-expense flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-state-expense/10 px-2 py-0.5 rounded-custom-full">
                  <AlertCircle size={12} /> Attention
                </span>
              ) : (
                <span className="text-text-secondary flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-surface-secondary px-2 py-0.5 rounded-custom-full">
                  <TrendingUp size={12} /> Watch Pace
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
