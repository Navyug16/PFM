import React, { useState, useMemo } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { useAuth } from '@/features/auth/auth-provider'
import { useOverviewData } from './hooks/useOverviewData'
import { useBudgetData } from '@/features/budgets/hooks/useBudgetData'
import { useSettings } from '@/features/settings/hooks/useSettings'

// ACRU Reference Layout Sub-components
import { ExpenseTrendCard } from './components/ExpenseTrendCard'
import { PeriodMetricStack } from './components/PeriodMetricStack'
import { AccountsCarousel } from './components/AccountsCarousel'
import { BudgetPlanCard } from './components/BudgetPlanCard'
import { InsightCard } from './components/InsightCard'
import { CostAnalysisCard } from './components/CostAnalysisCard'
import { FinancialHealthCard } from './components/FinancialHealthCard'
import { GoalSummaryCard } from './components/GoalSummaryCard'
import { RecentTransactionsCard } from './components/RecentTransactionsCard'

import { OverviewSkeleton } from './components/OverviewSkeleton'
import { OverviewEmptyState } from './components/OverviewEmptyState'
import { OverviewErrorState } from './components/OverviewErrorState'
import { QuickActionModal } from './components/QuickActionModal'
import { DailyCheckInModal } from '@/features/transactions/components/DailyCheckInModal'
import { TransactionForm } from '@/components/financial/TransactionForm'
import { useRecurringData } from '@/features/transactions/hooks/useRecurringData'
import { detectDuplicateCandidates } from '@/features/transactions/utils/duplicate-engine'
import { evaluateTransactionQuality, type QualityWarning } from '@/features/transactions/utils/quality-engine'

import type { PeriodOption } from './types'
import type { Transaction } from '@/features/financial/types'
import { deleteTransaction } from '@/features/financial/api/financial-api'
import { ChevronDown, Plus, X } from 'lucide-react'

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
  const { profile } = useSettings()

  const primaryCurrency = profile?.currency || 'INR'
  const userLocale = profile?.locale || 'en-IN'

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

  const periodOptionsList: { value: PeriodOption; label: string }[] = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'last_3_months', label: 'Last 3 Months' },
    { value: 'last_6_months', label: 'Last 6 Months' },
    { value: 'calendar_year', label: 'Calendar Year' },
    { value: 'financial_year', label: 'Financial Year' }
  ]

  // Render State Handling
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
        <OverviewErrorState error={error} onRetry={refetch} />
      </PageContainer>
    )
  }

  if (!data || data.accounts.length === 0) {
    return (
      <PageContainer>
        <OverviewEmptyState />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="space-y-6 pb-20">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-primary border border-border-neutral rounded-custom-xl p-4 shadow-sm">
          {/* Header Left: Greeting */}
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
              {getGreeting()}
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Financial Overview ({new Date(data.startDate).toLocaleDateString(userLocale, { month: 'short', day: 'numeric' })} - {new Date(data.endDate).toLocaleDateString(userLocale, { month: 'short', day: 'numeric', year: 'numeric' })})
            </p>
          </div>

          {/* Header Right: Dynamic Dashboard Period Selector */}
          <div className="self-start md:self-auto">
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as PeriodOption)}
                className="appearance-none bg-surface-secondary border border-border-neutral hover:border-brand-orange/50 text-text-primary text-xs font-bold py-2 pl-3 pr-8 rounded-custom-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-orange transition-all"
              >
                {periodOptionsList.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* ROW 1: MAIN EXPENSE TREND (58%) + PERIOD METRICS (17%) + ACCOUNTS CAROUSEL (25%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Main Chart: Expense Trend */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col">
            <ExpenseTrendCard
              transactions={data.transactions}
              categories={data.categories}
              accounts={data.accounts}
              startDate={data.startDate}
              endDate={data.endDate}
              primaryCurrency={primaryCurrency}
              userLocale={userLocale}
            />
          </div>

          {/* Period Financial Metrics Stack */}
          <div className="lg:col-span-2 xl:col-span-2 flex flex-col">
            <PeriodMetricStack
              periodIncome={data.periodIncome}
              periodExpenses={data.periodExpenses}
              periodSavings={data.periodSavings}
              savingsRate={data.savingsRate}
              prevPeriodIncome={data.prevPeriodIncome}
              prevPeriodExpenses={data.prevPeriodExpenses}
              primaryCurrency={primaryCurrency}
              userLocale={userLocale}
            />
          </div>

          {/* Accounts Carousel (My Card section replacement) */}
          <div className="lg:col-span-3 xl:col-span-3 flex flex-col">
            <AccountsCarousel
              availableBalance={data.availableBalance}
              accounts={data.accounts}
              primaryCurrency={primaryCurrency}
              userLocale={userLocale}
            />
          </div>
        </div>

        {/* ROW 2: MONTHLY SPENDING LIMIT (50%) + INSIGHT CARD (50%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-6 flex flex-col">
            <BudgetPlanCard
              budgetInfo={budgetInfo}
              primaryCurrency={primaryCurrency}
              userLocale={userLocale}
            />
          </div>
          <div className="lg:col-span-6 flex flex-col">
            <InsightCard insights={data.insights} />
          </div>
        </div>

        {/* ROW 3: COST ANALYSIS (25%) + FINANCIAL HEALTH (22%) + GOAL TRACKER (25%) + RECENT TRANSACTIONS (28%) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-3 flex flex-col">
            <CostAnalysisCard
              transactions={data.transactions}
              categories={data.categories}
              accounts={data.accounts}
              startDate={data.startDate}
              endDate={data.endDate}
              primaryCurrency={primaryCurrency}
              userLocale={userLocale}
            />
          </div>
          <div className="lg:col-span-3 flex flex-col">
            <FinancialHealthCard
              periodIncome={data.periodIncome}
              periodExpenses={data.periodExpenses}
              periodSavings={data.periodSavings}
              savingsRate={data.savingsRate}
              primaryCurrency={primaryCurrency}
              userLocale={userLocale}
            />
          </div>
          <div className="lg:col-span-3 flex flex-col">
            <GoalSummaryCard
              goals={data.activeGoals}
              contributions={data.goalContributions}
              primaryCurrency={primaryCurrency}
              userLocale={userLocale}
            />
          </div>
          <div className="lg:col-span-3 flex flex-col">
            <RecentTransactionsCard
              transactions={data.transactions}
              categories={data.categories}
              accounts={data.accounts}
              primaryCurrency={primaryCurrency}
              userLocale={userLocale}
            />
          </div>
        </div>
      </div>

      {/* FLOATING QUICK ADD FAB BUTTON */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => handleOpenQuickAdd('expense')}
          className="w-13 h-13 rounded-full bg-brand-orange text-white shadow-elevated flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer border-none focus:outline-none focus:ring-2 focus:ring-brand-orange/50"
          aria-label="Quick Add Transaction"
        >
          <Plus size={26} className="stroke-[2.5]" />
        </button>
      </div>

      {/* QUICK ACTION MODAL */}
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

      {/* DAILY CHECK-IN MODAL */}
      {hasDailyCheckInIssues && (
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
            budgetInfo.refetch()
            return tx
          }}
          onSkipOccurrence={async (id) => {
            await skipOccurrence(id)
          }}
          onDismissDuplicate={async (tx1Id, tx2Id) => {
            await dismissDuplicate(tx1Id, tx2Id)
          }}
          onDeleteTransaction={async (id) => {
            await deleteTransaction(id)
            await refetch()
          }}
          onEditTransaction={(tx) => {
            setEditingTx(tx)
            setIsDailyCheckInOpen(false)
          }}
          onSuccess={() => {
            refetch()
            budgetInfo.refetch()
          }}
        />
      )}

      {/* EDIT TRANSACTION MODAL */}
      {editingTx && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-6 w-full max-w-lg shadow-elevated relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-neutral/40">
              <h3 className="text-base font-bold text-text-primary">Edit Transaction</h3>
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

export default OverviewPage
