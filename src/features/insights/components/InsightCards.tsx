import React, { useState } from 'react'
import type { FinancialInsight } from '../utils/report-insight-engine'
import { Sparkles, AlertCircle, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface InsightCardsProps {
  insights: FinancialInsight[]
}

export const InsightCards: React.FC<InsightCardsProps> = ({ insights }) => {
  const [showAll, setShowAll] = useState(false)

  if (insights.length === 0) {
    return (
      <div className="bg-surface-secondary border border-border-neutral rounded-custom-xl p-6 text-center space-y-2">
        <Sparkles size={28} className="text-text-muted mx-auto" />
        <h4 className="text-sm font-bold text-text-primary">No insights generated yet</h4>
        <p className="text-xs text-text-secondary max-w-sm mx-auto">
          Add more transactions, configure category budgets, or track active savings goals to generate performance alerts.
        </p>
      </div>
    )
  }

  // Display only top 3 unless toggled
  const displayedInsights = showAll ? insights : insights.slice(0, 3)

  const severityIcons = {
    positive: <CheckCircle size={18} className="text-state-income shrink-0 mt-0.5" />,
    neutral: <Sparkles size={18} className="text-brand-purple shrink-0 mt-0.5" />,
    review: <AlertTriangle size={18} className="text-brand-purple shrink-0 mt-0.5" />,
    important: <AlertCircle size={18} className="text-state-expense shrink-0 mt-0.5" />
  }

  const severityClasses = {
    positive: 'border-state-income/20 bg-state-income/5 text-text-primary',
    neutral: 'border-border-neutral bg-surface-secondary text-text-primary',
    review: 'border-brand-purple/20 bg-brand-purple/5 text-text-primary',
    important: 'border-state-expense/20 bg-state-expense/5 text-text-primary'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
          <Sparkles size={18} className="text-brand-purple" />
          <span>Prioritized Financial Insights</span>
        </h3>
        {insights.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-bold text-brand-purple hover:underline cursor-pointer transition-all"
          >
            {showAll ? 'Show Fewer Insights' : `View All (${insights.length})`}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayedInsights.map((insight) => (
          <div
            key={insight.id}
            className={`border rounded-custom-xl p-5 flex flex-col justify-between space-y-4 transition-all hover:shadow-subtle ${
              severityClasses[insight.severity]
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-start gap-2.5">
                {severityIcons[insight.severity]}
                <div>
                  <h4 className="text-sm font-extrabold text-text-primary">
                    {insight.title}
                  </h4>
                  <p className="text-xs font-semibold text-text-secondary mt-0.5">
                    {insight.statement}
                  </p>
                </div>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed pl-7">
                {insight.explanation}
              </p>
            </div>

            {insight.actionLabel && insight.actionPath && (
              <Link
                to={insight.actionPath}
                className="inline-flex items-center gap-1 text-xs font-bold text-brand-purple hover:underline self-start pl-7 transition-all"
              >
                <span>{insight.actionLabel}</span>
                <ArrowRight size={12} />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
