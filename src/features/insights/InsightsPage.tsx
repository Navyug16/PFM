import React, { useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { useInsightsData } from './hooks/useInsightsData'
import type { ReportPeriodPreset } from '@/features/financial/utils/date-utils'
import { PeriodSelector } from './components/PeriodSelector'
import { ReportSummary } from './components/ReportSummary'
import { InsightCards } from './components/InsightCards'
import { SpendingBreakdown } from './components/SpendingBreakdown'
import { CashFlowTrend } from './components/CashFlowTrend'
import { SavingsTrend } from './components/SavingsTrend'
import { LargestExpenses } from './components/LargestExpenses'
import { FinancialYearReview } from './components/FinancialYearReview'
import { ExportPanel } from './components/ExportPanel'
import { RefreshCw } from 'lucide-react'

export const InsightsPage: React.FC = () => {
  const [preset, setPreset] = useState<ReportPeriodPreset>('this_month')
  
  // Set default custom dates range to trailing 30 days
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

  const [customStart, setCustomStart] = useState(thirtyDaysAgoStr)
  const [customEnd, setCustomEnd] = useState(todayStr)

  const { loading, error, data, refetch } = useInsightsData(preset, customStart, customEnd)

  const handleCustomDatesChange = (start: string, end: string) => {
    setCustomStart(start)
    setCustomEnd(end)
  }

  return (
    <PageContainer>
      <PageHeader
        title="Financial Reports & Insights"
        description="Deterministic trend compilation, periodic aggregates, category breakdown reviews, and CSV exports."
      />

      <div className="mt-8 space-y-6">
        {/* 1. Period Selector Presets Dropdown */}
        <PeriodSelector
          preset={preset}
          onPresetChange={setPreset}
          customStart={customStart}
          customEnd={customEnd}
          onCustomDatesChange={handleCustomDatesChange}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] bg-surface-secondary border border-border-neutral rounded-custom-xl p-8 text-center space-y-3">
            <RefreshCw size={28} className="animate-spin text-brand-purple" />
            <p className="text-sm font-semibold text-text-secondary">Compiling ledger reports...</p>
          </div>
        ) : error ? (
          <div className="bg-state-expense/10 border border-state-expense/20 text-state-expense text-sm font-semibold rounded-custom-xl p-5 text-center">
            <span>{error}</span>
            <button
              onClick={() => refetch()}
              className="block mx-auto mt-2 text-xs font-bold text-brand-purple hover:underline cursor-pointer"
            >
              Retry Compilation
            </button>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* 2. Overview Summary Cards */}
            <ReportSummary
              income={data.income}
              expenses={data.expenses}
              savings={data.savings}
              savingsRate={data.savingsRate}
              prevIncome={data.prevIncome}
              prevExpenses={data.prevExpenses}
              prevSavings={data.prevSavings}
              prevSavingsRate={data.prevSavingsRate}
            />

            {/* 3. Prioritized Financial Insights */}
            <InsightCards insights={data.insights} />

            {/* 4. Multi-column Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Outlays */}
              <SpendingBreakdown breakdown={data.categoriesBreakdown} />

              {/* Cash Flow Trends */}
              <CashFlowTrend trendPoints={data.trendPoints} />
            </div>

            {/* 5. Indian Financial Year Review Section (renders only when preset is active) */}
            {preset === 'indian_financial_year' && (
              <FinancialYearReview
                fyReview={data.fyReview}
                fyStart={data.start}
                fyEnd={data.end}
              />
            )}

            {/* 6. Savings and Balance Progression (over full ledger history) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SavingsTrend savingsPoints={data.monthlySavingsTrend} />
              <LargestExpenses
                transactions={data.rawTransactions}
                accounts={data.rawAccounts}
                categories={data.rawCategories}
              />
            </div>

            {/* 7. Local Export Panel */}
            <ExportPanel
              transactions={data.rawTransactions}
              accounts={data.rawAccounts}
              categories={data.rawCategories}
              goals={data.rawGoals}
              contributionsMap={data.rawContributionsMap}
              todayStr={data.todayStr}
              periodExpenses={data.expenses}
            />
          </div>
        ) : null}
      </div>
    </PageContainer>
  )
}
export default InsightsPage;
