import React from 'react'
import type { FinancialInsight } from '../types'
import { Sparkles, ArrowRight, Lightbulb } from 'lucide-react'
import { Link } from 'react-router-dom'

interface InsightCardProps {
  insights: FinancialInsight[]
}

export const InsightCard: React.FC<InsightCardProps> = ({ insights }) => {
  const topInsight = insights && insights.length > 0 ? insights[0] : null

  const renderFormattedText = (text: string) => {
    if (text.includes('**')) {
      const parts = text.split('**')
      return (
        <>
          <strong className="font-extrabold text-text-primary">{parts[1]}</strong>
          {parts[2]}
        </>
      )
    }
    return text
  }

  return (
    <div className="bg-surface-primary border border-border-neutral border-l-4 border-l-brand-orange rounded-custom-xl p-5 shadow-sm flex flex-col justify-between h-full min-h-[170px]">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-custom-md bg-brand-orange/10 text-brand-orange">
            <Sparkles size={15} />
          </span>
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            INSIGHT
          </h3>
        </div>
        <Link
          to="/insights"
          className="text-xs font-semibold text-brand-orange hover:underline flex items-center gap-1"
        >
          View Insights <ArrowRight size={12} />
        </Link>
      </div>

      {/* Main Content */}
      {!topInsight ? (
        <div className="my-auto py-2 flex items-center gap-3 text-text-muted">
          <Lightbulb size={20} className="text-brand-orange shrink-0" />
          <p className="text-xs text-text-secondary">
            Keep logging transactions to unlock personalized position insights and savings tips.
          </p>
        </div>
      ) : (
        <div className="my-auto space-y-1 py-1">
          <h4 className="text-xs font-bold text-text-primary">
            {topInsight.question}
          </h4>
          <p className="text-xs text-text-secondary leading-relaxed font-medium">
            {renderFormattedText(topInsight.answer)}
          </p>
        </div>
      )}

      {/* Footer Link */}
      <div className="pt-1 border-t border-border-neutral/30 flex items-center justify-between text-[11px] text-text-muted">
        <span>Deterministic Rule Analysis</span>
        <Link to="/insights" className="text-brand-orange font-bold hover:underline">
          Read more &gt;
        </Link>
      </div>
    </div>
  )
}
