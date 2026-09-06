import React, { useState, useMemo } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { useAuth } from '@/features/auth/auth-provider'
import { useOverviewData } from './hooks/useOverviewData'
import { useBudgetData } from '@/features/budgets/hooks/useBudgetData'
import { OverviewSkeleton } from './components/OverviewSkeleton'
import { OverviewEmptyState } from './components/OverviewEmptyState'
import { OverviewErrorState } from './components/OverviewErrorState'
import { QuickActionModal } from './components/QuickActionModal'
import { DashboardHeroCard } from './components/DashboardHeroCard'
import { PeriodCashFlowStrip } from './components/PeriodCashFlowStrip'
import { MonthlyPlanBanner } from './components/MonthlyPlanBanner'
import { CategorySpendingCard } from './components/CategorySpendingCard'
import { TodayGlanceCard } from './components/TodayGlanceCard'
import { GoalProgressSummary } from './components/GoalProgressSummary'
import { CashFlowTrend } from '@/features/insights/components/CashFlowTrend'
import type { TrendPoint } from '@/features/insights/utils/report-calculations'
import { calculatePeriodComparisonMulti } from '../financial/utils/calculations'
import { getPeriodBounds } from '../financial/utils/date-utils'
import type { PeriodOption } from './types'
import { useSettings } from '@/features/settings/hooks/useSettings'
import {
  ChevronDown,
  Calendar,
  Sparkles,
  Plus,
  ArrowRight,
  Info
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { deleteTransaction } from '@/features/financial/api/financial-api'
import type { Transaction } from '@/features/financial/types'
import type { QualityWarning } from '@/features/transactions/utils/quality-engine'
import { TransactionForm } from '@/components/financial/TransactionForm'
import { useRecurringData } from '@/features/transactions/hooks/useRecurringData'
import { detectDuplicateCandidates } from '@/features/transactions/utils/duplicate-engine'
import { evaluateTransactionQuality } from '@/features/transactions/utils/quality-engine'
import { DailyCheckInModal } from '@/features/transactions/components/DailyCheckInModal'
import { X } from 'lucide-react'

export const OverviewPage: React.FC = () => {
  const { user } = useAuth()
  const [period, setPeriod] = useState<PeriodOption>('month')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [defaultTxType, setDefaultTxType] = useState<'expense' | 'income' | 'transfer'>('expense')

  // Check-In and Edit States
  const [isDailyCheckInOpen, setIsDailyCheckInOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)

  const { data, loading, error, refetch } = useOverviewData(period)
  const budgetInfo = useBudgetData()

  const {
    occurrences,
    dismissedPairs,
    confirmOccurrence,
    skipOccurrence,
    dismissDuplicate,
    refetch: refetchRecurring
  } = useRecurringData()

  const todayStr = new Date().toISOString().split('T')[0]

  const categoryContext = useMemo(() => {
    const ctx: { [id: string]: { name: string; is_active: boolean } } = {}
    if (data) {
      data.categories.forEach((cat) => {
        ctx[cat.id] = { name: cat.name, is_active: cat.is_active }
      })
    }
    return ctx
  }, [data])

  const accountContext = useMemo(() => {
    const ctx: { [id: string]: { name: string; is_active: boolean } } = {}
    if (data) {
      data.accounts.forEach((acc) => {
        ctx[acc.id] = { name: acc.name, is_active: acc.is_active }
      })
    }
    return ctx
  }, [data])

  const duplicateWarnings = useMemo(() => {
    if (!data) return []
    return detectDuplicateCandidates(data.transactions, dismissedPairs)
  }, [data, dismissedPairs])

  const qualityWarnings = useMemo(() => {
    if (!data) return []
    const warnings: QualityWarning[] = []
    data.transactions.forEach((tx) => {
      const txWarnings = evaluateTransactionQuality(
        tx,
        { categories: categoryContext, accounts: accountContext },
        todayStr
      )
      warnings.push(...txWarnings)
    })
    return warnings
  }, [data, categoryContext, accountContext, todayStr])

  const pendingOccurrences = useMemo(() => {
    return occurrences.filter((occ) => occ.status === 'pending' && occ.due_date <= todayStr)
  }, [occurrences, todayStr])

  const hasDailyCheckInIssues =
    pendingOccurrences.length > 0 || duplicateWarnings.length > 0 || qualityWarnings.length > 0

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'
  const firstName = displayName.split(' ')[0]

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return `Good morning, ${firstName}`
    if (hour < 17) return `Good afternoon, ${firstName}`
    return `Good evening, ${firstName}`
  }

  const handleOpenQuickAdd = (type: 'expense' | 'income' | 'transfer') => {
    setDefaultTxType(type)
    setIsModalOpen(true)
  }

  const { profile } = useSettings()
  const primaryCurrency = profile?.currency || 'INR'
  const userLocale = profile?.locale || 'en-IN'

  const renderInsightAnswer = (text: string) => {
    if (text.includes('**')) {
      const parts = text.split('**')
      return (
        <>
          <strong className="font-bold text-text-primary">{parts[1]}</strong>
          {parts[2]}
        </>
      )
    }
    return text
  }

  // Date Bounds Label
  const { start: dateStart, end: dateEnd } = getPeriodBounds(period)
  const dateRangeLabel = `${new Date(dateStart).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric'
  })} - ${new Date(dateEnd).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })}`

  // Render Skeleton / Error
  if (loading) {
    return (
      <PageContainer>
        <OverviewSkeleton />
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer>
        <OverviewErrorState onRetry={refetch} message={error} />
      </PageContainer>
    )
  }

  if (!data) return null

  // STATE A: No Accounts Exist
  if (data.accounts.length === 0) {
    return (
      <PageContainer>
        <OverviewEmptyState type="no_accounts" />
      </PageContainer>
    )
  }

  // Comparisons
  const incomeCompare = calculatePeriodComparisonMulti(
    data.periodIncome,
    data.prevPeriodIncome,
    primaryCurrency
  )
  const expenseCompare = calculatePeriodComparisonMulti(
    data.periodExpenses,
    data.prevPeriodExpenses,
    primaryCurrency
  )
  const savingsCompare = calculatePeriodComparisonMulti(
    data.periodSavings,
    data.prevPeriodSavings,
    primaryCurrency
  )

  // Map cashFlowIntervals to TrendPoint[] for CashFlowTrend component
  const trendPoints: TrendPoint[] = data.cashFlowIntervals.map((i) => {
    const savings = i.income - i.expenses
    const savingsRate = i.income > 0 ? (savings / i.income) * 100 : 0
    return {
      label: i.label,
      income: i.income,
      expenses: i.expenses,
      savings,
      savingsRate
    }
  })

  const hasTransactions = data.transactions.length > 0

  return (
    <PageContainer>
      {/* TIER 1 — GREETING & PERIOD CONTEXT HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-neutral/60 pb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">
            {getGreeting()}
          </h1>
          <p className="text-xs md:text-sm text-text-secondary mt-1 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-state-positive" />
            Your finances are up to date through today ({dateRangeLabel})
          </p>
        </div>

        {/* Period Selector Dropdown */}
        <div className="relative inline-block w-48">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodOption)}
            className="w-full bg-surface-secondary border border-border-neutral hover:border-brand-orange text-text-primary text-sm font-semibold rounded-custom-md px-4 py-2.5 outline-none cursor-pointer appearance-none transition-all pr-10"
            aria-label="Select date period"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="financial_year">Financial Year</option>
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
          />
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {/* Daily Money Check-In Callout */}
        {hasDailyCheckInIssues && (
          <div className="bg-brand-orange/10 border border-brand-orange/20 rounded-custom-xl p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-subtle select-none">
            <div className="flex items-start gap-3">
              <Calendar className="text-brand-orange shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-sm font-bold text-text-primary">Daily Money Check-In</h4>
                <p className="text-xs text-text-secondary mt-1">
                  You have {pendingOccurrences.length} scheduled bills, {duplicateWarnings.length} duplicates, and {qualityWarnings.length} ledger quality recommendations pending review.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsDailyCheckInOpen(true)}
              className="px-4.5 py-2.5 bg-brand-orange hover:bg-brand-orange-hover text-text-primary text-xs font-semibold rounded-custom-md cursor-pointer transition-all shrink-0 self-end md:self-center"
            >
              Start 60s Check-In
            </button>
          </div>
        )}

        {/* STATE B NOTICE: Accounts Exist but 0 Transactions */}
        {!hasTransactions && (
          <div className="bg-surface-secondary/80 border border-border-neutral rounded-custom-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Info className="text-brand-orange shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="text-sm font-bold text-text-primary">No transactions recorded yet</h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Your Available Funds above are calculated from your active account balances. Log your first transaction to unlock period cash flows and spending trends.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleOpenQuickAdd('income')}
              className="px-4 py-2 bg-brand-orange hover:bg-brand-orange-hover text-text-primary font-semibold text-xs rounded-custom-md transition-all shrink-0 self-start sm:self-center cursor-pointer"
            >
              + Log First Transaction
            </button>
          </div>
        )}

        {/* TIER 2 — PRIMARY FINANCIAL POSITION (SOLVENCY HERO & PERIOD CASH FLOW) */}
        <div className="space-y-6">
          {/* Primary Hero: Total Available Funds & Balance Sheet */}
          <DashboardHeroCard
            availableBalance={data.availableBalance}
            netPosition={data.netPosition}
            accounts={data.accounts}
            transactions={data.transactions}
            primaryCurrency={primaryCurrency}
            userLocale={userLocale}
          />

          {/* Period Cash Flow Strip */}
          <PeriodCashFlowStrip
            income={data.periodIncome}
            expenses={data.periodExpenses}
            savings={data.periodSavings}
            savingsRate={data.savingsRate}
            incomeCompare={incomeCompare}
            expenseCompare={expenseCompare}
            savingsCompare={savingsCompare}
            primaryCurrency={primaryCurrency}
            userLocale={userLocale}
            dateRangeLabel={dateRangeLabel}
          />
        </div>

        {/* TIER 3 — PLAN & TREND */}
        <div className="space-y-6">
          {/* Active Budget & Safe-To-Spend Banner */}
          <MonthlyPlanBanner
            budgetInfo={budgetInfo}
            primaryCurrency={primaryCurrency}
            userLocale={userLocale}
          />

          {/* Redesigned Income vs Expenses Trend Chart */}
          <CashFlowTrend
            trendPoints={trendPoints}
            primaryCurrency={primaryCurrency}
            userLocale={userLocale}
          />
        </div>

        {/* TIER 4 — SUPPORTING INFORMATION (2-COLUMN GRID DESKTOP) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Spending Categories & Goal Progress */}
          <div className="space-y-6">
            <CategorySpendingCard
              categoryShare={data.categoryShare}
              primaryCurrency={primaryCurrency}
              userLocale={userLocale}
            />

            <GoalProgressSummary
              activeGoals={data.activeGoals}
              goalContributions={data.goalContributions}
              primaryCurrency={primaryCurrency}
              userLocale={userLocale}
            />
          </div>

          {/* Right Column: Today at a Glance & Questions About Your Money */}
          <div className="space-y-6">
            <TodayGlanceCard
              todayExpenses={data.todayExpenses}
              todayCount={data.todayCount}
              dailyAverage={data.dailyAverage}
              todayMaxExpense={data.todayMaxExpense}
              onQuickAdd={handleOpenQuickAdd}
              primaryCurrency={primaryCurrency}
              userLocale={userLocale}
            />

            {/* Questions about your money (Insights) */}
            <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border-neutral/40">
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <Sparkles size={18} className="text-brand-orange" />
                  Questions about your money
                </h3>
                <Link to="/insights" className="text-xs font-bold text-brand-orange hover:underline">
                  All Insights &rarr;
                </Link>
              </div>

              <div className="space-y-3">
                {data.insights.length > 0 ? (
                  data.insights.slice(0, 3).map((ins) => (
                    <div
                      key={ins.id}
                      className="bg-surface-secondary/40 border border-border-neutral/50 rounded-custom-lg p-4 space-y-2 group hover:border-brand-orange/40 transition-all"
                    >
                      <span className="text-text-secondary text-[10px] font-bold uppercase tracking-wider block">
                        {ins.question}
                      </span>
                      <p className="text-xs md:text-sm font-medium text-text-primary leading-relaxed">
                        {renderInsightAnswer(ins.answer)}
                      </p>
                      {ins.actionPath && (
                        <div className="pt-2 flex justify-end">
                          <Link
                            to={ins.actionPath}
                            className="text-xs font-bold text-brand-orange group-hover:underline flex items-center gap-0.5"
                          >
                            {ins.actionLabel || 'Analyze'}{' '}
                            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-text-secondary text-xs">
                    No active insights generated for this range.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE FLOATING ACTION BUTTON — BOTTOM-RIGHT */}
      <div className="md:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => handleOpenQuickAdd('expense')}
          className="w-14 h-14 bg-brand-orange hover:bg-brand-orange-hover text-text-primary rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Quick Log Expense"
        >
          <Plus size={28} />
        </button>
      </div>

      {/* Quick Transaction Log Modal */}
      <QuickActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        accounts={data.accounts}
        categories={data.categories}
        onSuccess={() => {
          refetch()
          budgetInfo.refetch()
        }}
        defaultType={defaultTxType}
      />

      {/* Daily Check-In Modal Dialog */}
      <DailyCheckInModal
        isOpen={isDailyCheckInOpen}
        onClose={() => setIsDailyCheckInOpen(false)}
        pendingOccurrences={pendingOccurrences}
        duplicateWarnings={duplicateWarnings}
        qualityWarnings={qualityWarnings}
        transactions={data.transactions}
        accounts={data.accounts}
        categories={data.categories}
        onConfirmOccurrence={async (id) => {
          const tx = await confirmOccurrence(id)
          await refetch()
          return tx
        }}
        onSkipOccurrence={async (id) => {
          await skipOccurrence(id)
          await refetch()
        }}
        onDismissDuplicate={async (tx1, tx2) => {
          await dismissDuplicate(tx1, tx2)
          await refetch()
        }}
        onDeleteTransaction={async (id) => {
          await deleteTransaction(id)
          await refetch()
        }}
        onEditTransaction={(tx) => setEditingTx(tx)}
        onSuccess={async () => {
          await refetch()
          await refetchRecurring()
          budgetInfo.refetch()
        }}
      />

      {/* Quick Edit Transaction Modal Overlay */}
      {editingTx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-6 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-bold text-text-primary">Edit Ledger Entry</h2>
              <button
                onClick={() => setEditingTx(null)}
                className="p-1 hover:bg-surface-secondary rounded-custom-md text-text-secondary hover:text-text-primary transition-all cursor-pointer border-none bg-transparent"
                aria-label="Close edit transaction modal"
              >
                <X size={18} />
              </button>
            </div>
            <TransactionForm
              initialTransaction={editingTx}
              accounts={data.accounts}
              categories={data.categories}
              onSuccess={async () => {
                setEditingTx(null)
                await refetch()
                await refetchRecurring()
                budgetInfo.refetch()
              }}
              onCancel={() => setEditingTx(null)}
            />
          </div>
        </div>
      )}
    </PageContainer>
  )
}
