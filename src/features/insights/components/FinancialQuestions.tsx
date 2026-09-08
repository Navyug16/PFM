import React, { useState } from 'react'
import { HelpCircle, Search, X, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import type { Transaction, Account, Category } from '@/features/financial/types'
import type { ReportPeriodPreset } from '@/features/financial/utils/date-utils'
import {
  parseQuestion,
  executeQuestionIntent,
  SUGGESTED_QUESTIONS
} from '../utils/question-engine'
import type { QuestionResult } from '../utils/question-engine'

interface FinancialQuestionsProps {
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
  preset: ReportPeriodPreset
  customStart?: string
  customEnd?: string
}

export const FinancialQuestions: React.FC<FinancialQuestionsProps> = ({
  transactions,
  accounts,
  categories,
  preset,
  customStart,
  customEnd
}) => {
  const [query, setQuery] = useState('')
  const [activeResult, setActiveResult] = useState<QuestionResult | null>(null)
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null)

  const handleAsk = (searchQuery: string, suggestedId?: string) => {
    if (!searchQuery.trim()) return

    setActiveQuestionId(suggestedId || null)
    const parsed = parseQuestion(searchQuery, categories, preset)

    const result = executeQuestionIntent({
      intent: parsed.intent,
      matchedCategory: parsed.matchedCategory,
      periodPreset: parsed.periodPreset,
      periodLabel: parsed.periodLabel,
      transactions,
      accounts,
      categories,
      customStart,
      customEnd
    })

    if (parsed.intent === 'unsupported' && parsed.unsupportedReason) {
      result.explanation = parsed.unsupportedReason
    }

    setActiveResult(result)
  }

  const handleClear = () => {
    setQuery('')
    setActiveResult(null)
    setActiveQuestionId(null)
  }

  return (
    <div className="bg-surface-secondary border border-border-neutral rounded-custom-xl p-5 md:p-6 space-y-5">
      {/* 1. Component Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-neutral/60 pb-4">
        <div>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <HelpCircle size={18} className="text-brand-orange" />
            <span>Deterministic Financial Questions</span>
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Ask useful financial questions answered directly by PFM's trusted calculation engine.
          </p>
        </div>

        <div className="text-[11px] font-medium text-text-secondary bg-surface-primary border border-border-neutral px-2.5 py-1 rounded-custom-md self-start sm:self-auto">
          14 Rule-Based Intents
        </div>
      </div>

      {/* 2. Suggested Question Chips */}
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-2">
          Suggested Financial Questions:
        </label>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((sq) => {
            const isSelected = activeQuestionId === sq.id
            return (
              <button
                key={sq.id}
                type="button"
                onClick={() => {
                  setQuery(sq.text)
                  handleAsk(sq.text, sq.id)
                }}
                className={`min-h-[44px] px-3 py-2 rounded-custom-lg text-xs font-medium border transition-all text-left flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-orange ${
                  isSelected
                    ? 'bg-brand-orange/15 border-brand-orange text-brand-orange font-semibold shadow-subtle'
                    : 'bg-surface-primary border-border-neutral text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                }`}
                aria-label={`Ask suggested question: ${sq.text}`}
              >
                <span>{sq.text}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Search / Query Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleAsk(query)
        }}
        className="space-y-2"
      >
        <div className="relative flex items-center">
          <div className="absolute left-3.5 text-text-secondary pointer-events-none">
            <Search size={18} />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. How much did I spend on Food & Dining last month?"
            className="w-full h-11 pl-10 pr-24 bg-surface-primary border border-border-neutral rounded-custom-lg text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
            aria-label="Ask a financial question"
          />

          <div className="absolute right-1.5 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="h-8 w-8 flex items-center justify-center text-text-secondary hover:text-text-primary cursor-pointer rounded-custom-md focus:outline-none focus:ring-1 focus:ring-brand-orange"
                aria-label="Clear input"
              >
                <X size={16} />
              </button>
            )}

            <button
              type="submit"
              disabled={!query.trim()}
              className="h-8 px-3 bg-brand-orange hover:bg-brand-orange/90 disabled:opacity-40 disabled:hover:bg-brand-orange text-white text-xs font-semibold rounded-custom-md transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Ask</span>
            </button>
          </div>
        </div>
      </form>

      {/* 4. Structured Question Result Card */}
      {activeResult && (
        <div
          tabIndex={-1}
          aria-live="polite"
          className={`border rounded-custom-xl p-4 md:p-5 transition-all space-y-3 ${
            activeResult.status === 'success'
              ? 'bg-surface-primary border-brand-orange/40'
              : activeResult.status === 'clarification_needed'
              ? 'bg-surface-primary border-state-warning/50'
              : activeResult.status === 'no_data'
              ? 'bg-surface-primary border-border-neutral'
              : 'bg-surface-primary border-border-neutral/80'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-neutral/40 pb-3">
            <div className="flex items-center gap-2">
              {activeResult.status === 'success' ? (
                <CheckCircle2 size={18} className="text-brand-orange" />
              ) : activeResult.status === 'clarification_needed' ? (
                <AlertCircle size={18} className="text-state-warning" />
              ) : (
                <Info size={18} className="text-text-secondary" />
              )}

              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                {activeResult.status === 'success'
                  ? 'Calculated Metric Result'
                  : activeResult.status === 'clarification_needed'
                  ? 'Clarification Needed'
                  : activeResult.status === 'no_data'
                  ? 'No Transaction Data'
                  : 'Unsupported Scope'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-text-secondary bg-surface-secondary border border-border-neutral px-2 py-0.5 rounded-custom-md">
                {activeResult.periodLabel}
              </span>

              {activeResult.categoryName && (
                <span className="text-[11px] font-semibold text-brand-orange bg-brand-orange/10 border border-brand-orange/20 px-2 py-0.5 rounded-custom-md">
                  {activeResult.categoryName}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            {activeResult.status === 'success' && (
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-extrabold text-text-primary tracking-tight">
                  {activeResult.formattedValue}
                </span>

                {activeResult.comparisonText && (
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-custom-sm ${
                      activeResult.comparisonText.startsWith('+')
                        ? 'bg-state-expense/10 text-state-expense'
                        : activeResult.comparisonText.startsWith('-')
                        ? 'bg-state-income/10 text-state-income'
                        : 'bg-surface-secondary text-text-secondary'
                    }`}
                  >
                    {activeResult.comparisonText} vs prev period
                  </span>
                )}
              </div>
            )}

            <p className="text-xs text-text-secondary leading-relaxed">
              {activeResult.explanation}
            </p>
          </div>

          {activeResult.status === 'clarification_needed' && categories.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-text-secondary block mb-1.5">
                Available Categories in your ledger:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {categories.slice(0, 8).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      const newQuery = `How much did I spend on ${cat.name}?`
                      setQuery(newQuery)
                      handleAsk(newQuery)
                    }}
                    className="text-[11px] px-2 py-1 bg-surface-secondary hover:bg-surface-elevated text-text-primary rounded-custom-md border border-border-neutral transition-all cursor-pointer"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
