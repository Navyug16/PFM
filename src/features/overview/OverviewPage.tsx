import React, { useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { useAuth } from '@/features/auth/auth-provider'
import { useOverviewData } from './hooks/useOverviewData'
import { useBudgetData } from '@/features/budgets/hooks/useBudgetData'
import { OverviewSkeleton } from './components/OverviewSkeleton'
import { OverviewEmptyState } from './components/OverviewEmptyState'
import { OverviewErrorState } from './components/OverviewErrorState'
import { QuickActionModal } from './components/QuickActionModal'
import { calculatePeriodComparison } from '../financial/utils/calculations'
import { getPeriodBounds } from '../financial/utils/date-utils'
import type { PeriodOption } from './types'
import { formatCurrency as sharedFormatCurrency } from '@/features/financial/utils/formatters'
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Plus,
  Minus,
  Sparkles,
  Target,
  ArrowLeftRight,
  Clock,
  ChevronDown,
  Calendar,
  X
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

  const categoryContext = React.useMemo(() => {
    const ctx: { [id: string]: { name: string; is_active: boolean } } = {}
    if (data) {
      data.categories.forEach((cat) => {
        ctx[cat.id] = { name: cat.name, is_active: cat.is_active }
      })
    }
    return ctx
  }, [data])

  const accountContext = React.useMemo(() => {
    const ctx: { [id: string]: { name: string; is_active: boolean } } = {}
    if (data) {
      data.accounts.forEach((acc) => {
        ctx[acc.id] = { name: acc.name, is_active: acc.is_active }
      })
    }
    return ctx
  }, [data])

  const duplicateWarnings = React.useMemo(() => {
    if (!data) return []
    return detectDuplicateCandidates(data.transactions, dismissedPairs)
  }, [data, dismissedPairs])

  const qualityWarnings = React.useMemo(() => {
    if (!data) return []
    const warnings: QualityWarning[] = []
    data.transactions.forEach((tx) => {
      const txWarnings = evaluateTransactionQuality(tx, { categories: categoryContext, accounts: accountContext }, todayStr)
      warnings.push(...txWarnings)
    })
    return warnings
  }, [data, categoryContext, accountContext, todayStr])

  const pendingOccurrences = React.useMemo(() => {
    return occurrences.filter((occ) => occ.status === 'pending' && occ.due_date <= todayStr)
  }, [occurrences, todayStr])

  const hasDailyCheckInIssues = pendingOccurrences.length > 0 || duplicateWarnings.length > 0 || qualityWarnings.length > 0

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'
  const firstName = displayName.split(' ')[0]

  // Time-based Greeting Helper
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

  // Format Helper
  const formatCurrency = (val: number) => sharedFormatCurrency(val, 'INR', { maximumFractionDigits: 0 })

  const renderComparisonLabel = (
    compare: {
      absoluteChange: number;
      percentageChange: number;
      direction: 'up' | 'down' | 'unchanged' | 'unavailable';
      comparisonAvailable: boolean;
      percentChangeAvailable: boolean;
    },
    isExpense = false
  ) => {
    if (!compare.comparisonAvailable) return null
    const diffVal = formatCurrency(Math.abs(compare.absoluteChange))
    const changeText = compare.percentChangeAvailable
      ? `${compare.direction === 'up' ? '+' : '-'}${compare.percentageChange.toFixed(0)}%`
      : `${compare.direction === 'up' ? '+' : '-'}${diffVal}`

    const isPositiveEffect = (compare.direction === 'up' && !isExpense) || (compare.direction === 'down' && isExpense)

    return (
      <div className="flex items-center gap-1 mt-1.5 text-xs font-medium">
        {compare.direction === 'up' && (
          <span className={`${isPositiveEffect ? 'text-state-positive' : 'text-state-expense'} flex items-center gap-0.5`}>
            <ArrowUpRight size={13} /> {changeText}
          </span>
        )}
        {compare.direction === 'down' && (
          <span className={`${isPositiveEffect ? 'text-state-positive' : 'text-state-expense'} flex items-center gap-0.5`}>
            <ArrowDownRight size={13} /> {changeText}
          </span>
        )}
        {compare.direction === 'unchanged' && (
          <span className="text-text-secondary">Unchanged</span>
        )}
        <span className="text-text-muted">vs last period</span>
      </div>
    )
  }

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

  // Render States
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

  // A. No Accounts State
  if (data.accounts.length === 0) {
    return (
      <PageContainer>
        <OverviewEmptyState type="no_accounts" />
      </PageContainer>
    )
  }

  // B. No Transactions State
  if (data.transactions.length === 0) {
    return (
      <PageContainer>
        <OverviewEmptyState
          type="no_transactions"
          onQuickAction={() => handleOpenQuickAdd('income')}
        />
      </PageContainer>
    )
  }

  // Compare Flow Cards
  const incomeCompare = calculatePeriodComparison(data.periodIncome, data.prevPeriodIncome)
  const expenseCompare = calculatePeriodComparison(data.periodExpenses, data.prevPeriodExpenses)
  const savingsCompare = calculatePeriodComparison(data.periodSavings, data.prevPeriodSavings)

  const renderMonthlyPlan = () => {
    if (budgetInfo.loading) {
      return (
        <div className="h-28 bg-surface-secondary border border-border-neutral rounded-custom-xl animate-pulse" />
      )
    }

    const getPaceBadgeColor = (status: string) => {
      switch (status) {
        case 'exceeded':
          return 'text-state-expense bg-state-expense/10 border-state-expense/20'
        case 'at_risk':
          return 'text-amber-500 bg-amber-500/10 border-amber-500/20'
        case 'watch':
          return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
        case 'safe':
          return 'text-state-positive bg-state-positive/10 border-state-positive/20'
        default:
          return 'text-text-secondary bg-surface-secondary border-border-neutral'
      }
    }

    if (!budgetInfo.activeBudget) {
      return (
        <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-text-primary">Monthly spending plan</h4>
            <p className="text-xs text-text-secondary">No active budget plan for this period. Set up limits to unlock safe-to-spend insights.</p>
          </div>
          <Link
            to="/planning"
            className="text-xs font-bold text-brand-purple hover:underline shrink-0 bg-brand-purple/10 px-3.5 py-2 rounded-custom-md border border-brand-purple/20 text-center"
          >
            Setup Plan
          </Link>
        </div>
      )
    }

    const { spent, activeBudget: budget, usagePercentage, dailySafeToSpend, paceStatus } = budgetInfo

    return (
      <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Monthly Plan</span>
            <span className={`text-[9px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded-custom-full ${getPaceBadgeColor(paceStatus)}`}>
              {paceStatus === 'at_risk' ? 'At Risk' : paceStatus}
            </span>
          </div>
          <Link to="/planning" className="text-xs font-semibold text-brand-purple hover:underline">
            Adjust Plan &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Progress bar */}
          <div className="space-y-2 flex flex-col justify-center">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-text-secondary">{formatCurrency(spent)} Spent</span>
              <span className="text-text-primary">{formatCurrency(budget.total_limit)} Limit</span>
            </div>
            <div className="w-full h-2 bg-surface-secondary rounded-custom-full overflow-hidden">
              <div
                className={`h-full bg-brand-purple transition-all duration-300`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Right: Safe to spend */}
          <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 md:border-l border-border-neutral/60 pt-3 md:pt-0 md:pl-6">
            <div className="text-left md:text-right">
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Daily safe-to-spend</p>
              <p className="text-lg font-extrabold text-text-primary mt-0.5">{formatCurrency(dailySafeToSpend)} / day</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <PageContainer>
      {/* SECTION A — GREETING & PERIOD CONTEXT */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-neutral/60 pb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">
            {getGreeting()}
          </h2>
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
            className="w-full bg-surface-secondary border border-border-neutral hover:border-brand-purple text-text-primary text-sm font-semibold rounded-custom-md px-4 py-2.5 outline-none cursor-pointer appearance-none transition-all pr-10"
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
          <div className="bg-brand-purple/10 border border-brand-purple/20 rounded-custom-xl p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-subtle select-none">
            <div className="flex items-start gap-3">
              <Calendar className="text-brand-purple shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-sm font-bold text-text-primary">Daily Money Check-In</h4>
                <p className="text-xs text-text-secondary mt-1">
                  You have {pendingOccurrences.length} scheduled bills, {duplicateWarnings.length} duplicates, and {qualityWarnings.length} ledger quality recommendations pending review.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsDailyCheckInOpen(true)}
              className="px-4.5 py-2.5 bg-brand-purple hover:bg-brand-purple/95 text-text-primary text-xs font-semibold rounded-custom-md cursor-pointer transition-all shrink-0 self-end md:self-center"
            >
              Start 60s Check-In
            </button>
          </div>
        )}
        
        {/* SECTION B — FINANCIAL HERO (STOCK + FLOWS) */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Primary Hero: Available Balance */}
            <div className="lg:col-span-2 bg-gradient-to-br from-brand-purple/15 to-brand-purple/5 border border-brand-purple/20 rounded-custom-xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden min-h-[7rem]">
              <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-36 h-36 rounded-full bg-brand-purple/5 blur-3xl pointer-events-none" />
              <div>
                <span className="text-[10px] font-semibold text-brand-purple uppercase tracking-wider bg-brand-purple/10 px-2 py-0.5 rounded-custom-full">
                  Liquid Funds
                </span>
                <h4 className="text-xs font-semibold text-text-secondary mt-2">Available Balance</h4>
                <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight mt-0.5 tabular-nums">
                  {formatCurrency(data.availableBalance)}
                </h1>
              </div>
              <p className="text-[10px] text-text-secondary mt-3">
                Liquid asset balances (checking, savings, cash)
              </p>
            </div>

            {/* Net Financial Position Card */}
            <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-5 flex flex-col justify-between shadow-md min-h-[7rem]">
              <div>
                <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider bg-surface-secondary px-2 py-0.5 rounded-custom-full">
                  Balance Sheet
                </span>
                <h4 className="text-xs font-semibold text-text-secondary mt-2">Net Financial Position</h4>
                <h2 className="text-xl md:text-2xl font-bold text-text-primary tracking-tight mt-0.5 tabular-nums">
                  {formatCurrency(data.netPosition)}
                </h2>
              </div>
              <p className="text-[10px] text-text-secondary mt-3">
                All accounts including credit cards & liabilities
              </p>
            </div>
          </div>

          {/* SECTION B — PART 2: ACTIVE BUDGET BANNER */}
          {renderMonthlyPlan()}

          {/* Flow Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Income Card */}
            <div className="bg-surface-primary border border-border-neutral rounded-custom-lg p-4">
              <span className="text-text-secondary text-[10px] font-semibold uppercase tracking-wider">
                Income — Period
              </span>
              <p className="text-lg font-bold text-state-positive mt-1 tabular-nums">
                {formatCurrency(data.periodIncome)}
              </p>
              {renderComparisonLabel(incomeCompare, false)}
            </div>

            {/* Expenses Card */}
            <div className="bg-surface-primary border border-border-neutral rounded-custom-lg p-4">
              <span className="text-text-secondary text-[10px] font-semibold uppercase tracking-wider">
                Expenses — Period
              </span>
              <p className="text-lg font-bold text-state-expense mt-1 tabular-nums">
                {formatCurrency(data.periodExpenses)}
              </p>
              {renderComparisonLabel(expenseCompare, true)}
            </div>

            {/* Savings Card */}
            <div className="bg-surface-primary border border-border-neutral rounded-custom-lg p-4">
              <span className="text-text-secondary text-[10px] font-semibold uppercase tracking-wider">
                Savings — Period
              </span>
              <p className={`text-lg font-bold mt-1 tabular-nums ${data.periodSavings >= 0 ? 'text-state-positive' : 'text-state-expense'}`}>
                {formatCurrency(data.periodSavings)}
              </p>
              {renderComparisonLabel(savingsCompare, false)}
            </div>

            {/* Savings Rate Card */}
            <div className="bg-surface-primary border border-border-neutral rounded-custom-lg p-4">
              <span className="text-text-secondary text-[10px] font-semibold uppercase tracking-wider">
                Savings Rate
              </span>
              <p className="text-lg font-bold text-brand-purple mt-1 tabular-nums">
                {data.savingsRate.toFixed(1)}%
              </p>
              <div className="flex items-center gap-1 mt-1.5 text-[10px] text-text-muted">
                <span>Target threshold is 20%</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION C — QUESTIONS ABOUT YOUR MONEY (INSIGHTS) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base md:text-lg font-bold text-text-primary flex items-center gap-2">
              <Sparkles size={18} className="text-brand-purple animate-pulse" />
              Questions about your money
            </h3>
            <span className="text-xs text-text-secondary font-medium hidden md:inline">
              Deterministic insights computed from your records
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.insights.length > 0 ? (
              data.insights.slice(0, 4).map((ins) => (
                <div
                  key={ins.id}
                  className="bg-surface-primary border border-border-neutral rounded-custom-xl p-5 hover:border-border-neutral/95 transition-all flex flex-col justify-between shadow-sm relative group"
                >
                  <div className="space-y-2">
                    <p className="text-text-secondary text-xs font-bold uppercase tracking-wider">
                      {ins.question}
                    </p>
                    <p className="text-sm font-medium text-text-primary leading-relaxed pr-6">
                      {renderInsightAnswer(ins.answer)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-border-neutral/40">
                    <span className={`text-[10px] md:text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-custom-full ${
                      ins.direction === 'positive'
                        ? 'bg-state-positive/10 text-state-positive'
                        : ins.direction === 'negative'
                        ? 'bg-state-expense/10 text-state-expense'
                        : 'bg-surface-secondary text-text-secondary'
                    }`}>
                      {ins.supportingValue || 'Metric Alert'}
                    </span>
                    {ins.actionPath && (
                      <Link
                        to={ins.actionPath}
                        className="text-xs font-bold text-brand-purple group-hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        {ins.actionLabel || 'Analyze'} <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="md:col-span-2 text-center py-6 text-text-secondary bg-surface-primary border border-border-neutral rounded-custom-xl text-sm">
                No insights could be generated for this period range.
              </div>
            )}
          </div>
        </div>

        {/* SECTION D — QUICK ACTIONS & TODAY AT A GLANCE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions Row */}
          <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-6 flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="text-base font-bold text-text-primary mb-1">Quick Actions</h3>
              <p className="text-xs text-text-secondary mb-5">Instantly log entries from your daily budget check-in.</p>
            </div>
            
            {/* Desktop Actions layout */}
            <div className="grid grid-cols-3 md:grid-cols-1 gap-3 w-full">
              <button
                onClick={() => handleOpenQuickAdd('expense')}
                className="py-2.5 bg-state-expense/10 hover:bg-state-expense/15 text-state-expense font-semibold text-xs md:text-sm rounded-custom-md transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-state-expense/20"
              >
                <Minus size={16} /> Expense
              </button>
              <button
                onClick={() => handleOpenQuickAdd('income')}
                className="py-2.5 bg-state-positive/10 hover:bg-state-positive/15 text-state-positive font-semibold text-xs md:text-sm rounded-custom-md transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-state-positive/20"
              >
                <Plus size={16} /> Income
              </button>
              <button
                onClick={() => handleOpenQuickAdd('transfer')}
                className="py-2.5 bg-brand-purple/10 hover:bg-brand-purple/15 text-brand-purple font-semibold text-xs md:text-sm rounded-custom-md transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-brand-purple/20"
              >
                <ArrowLeftRight size={14} /> Transfer
              </button>
            </div>
          </div>

          {/* Today at a Glance */}
          <div className="lg:col-span-2 bg-surface-primary border border-border-neutral rounded-custom-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Clock size={16} className="text-brand-purple" /> Today at a glance
              </h3>
              <p className="text-xs text-text-secondary mt-1">Summary of today's activity.</p>
            </div>

            <div className="grid grid-cols-3 gap-4 py-4 my-2 border-y border-border-neutral/40">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Spent Today</span>
                <p className="text-base md:text-lg font-bold text-text-primary tabular-nums">
                  {formatCurrency(data.todayExpenses)}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Entries logged</span>
                <p className="text-base md:text-lg font-bold text-text-primary tabular-nums">
                  {data.todayCount}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Daily Average</span>
                <p className="text-base md:text-lg font-bold text-text-secondary tabular-nums">
                  {formatCurrency(data.dailyAverage)}
                </p>
              </div>
            </div>

            <div className="text-xs text-text-secondary">
              {data.todayMaxExpense ? (
                <p>
                  Largest today: <strong className="text-state-expense font-bold">{formatCurrency(data.todayMaxExpense.amount)}</strong> for "{data.todayMaxExpense.payee_or_source}"
                </p>
              ) : (
                <p>No expenses logged today yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION E — SPENDING BREAKDOWN & CASH FLOW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Spending Breakdown */}
          <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-neutral/40">
              <h3 className="text-base font-bold text-text-primary">Spending Breakdown</h3>
              <Link to="/transactions?type=expense" className="text-xs font-bold text-brand-purple hover:underline">
                View All
              </Link>
            </div>

            {data.categoryShare.length > 0 ? (
              <div className="space-y-4 pt-2">
                {data.categoryShare.slice(0, 5).map((share, idx) => (
                  <div key={share.category?.id || idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-text-primary font-semibold">{share.category?.name || 'Uncategorized'}</span>
                      <div className="space-x-2">
                        <span className="text-text-primary font-bold">{formatCurrency(share.amount)}</span>
                        <span className="text-text-secondary">({share.percentage.toFixed(0)}%)</span>
                      </div>
                    </div>
                    {/* Compact Custom CSS Bar Indicator */}
                    <div className="w-full bg-surface-secondary rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-brand-purple h-full rounded-full transition-all duration-500"
                        style={{ width: `${share.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6">
                <OverviewEmptyState type="no_period_expenses" />
              </div>
            )}
          </div>

          {/* Cash Flow View */}
          <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-border-neutral/40">
              <h3 className="text-base font-bold text-text-primary">Cash Flow</h3>
              <div className="flex items-center gap-3 text-xs text-text-secondary">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2.5 h-2.5 rounded bg-brand-purple" /> Income
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2.5 h-2.5 rounded bg-surface-secondary border border-border-neutral" /> Expense
                </span>
              </div>
            </div>

            {/* Custom Responsive Double-Bar Chart or Sparse Data Fallback */}
            {data.cashFlowIntervals.filter((i) => i.income > 0 || i.expenses > 0).length < 2 ? (
              <div className="flex items-center justify-around h-44 pt-6 text-center">
                <div className="space-y-1 bg-surface-secondary/20 border border-border-neutral/40 rounded-custom-lg p-4 flex-1 mx-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Total Income</span>
                  <p className="text-lg font-bold text-state-positive tabular-nums">
                    {formatCurrency(data.periodIncome)}
                  </p>
                  <div className="w-8 h-1 bg-brand-purple rounded-full mx-auto mt-2" />
                </div>
                <div className="space-y-1 bg-surface-secondary/20 border border-border-neutral/40 rounded-custom-lg p-4 flex-1 mx-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Total Expenses</span>
                  <p className="text-lg font-bold text-state-expense tabular-nums">
                    {formatCurrency(data.periodExpenses)}
                  </p>
                  <div className="w-8 h-1 bg-surface-secondary border border-border-neutral rounded-full mx-auto mt-2" />
                </div>
              </div>
            ) : (
              <div className="flex items-end justify-between gap-3 h-44 pt-6">
                {data.cashFlowIntervals.map((interval, idx) => {
                  const maxVal = Math.max(
                    ...data.cashFlowIntervals.map((i) => Math.max(i.income, i.expenses)),
                    1000
                  )
                  const incPct = (interval.income / maxVal) * 100
                  const expPct = (interval.expenses / maxVal) * 100

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end relative">
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-surface-secondary border border-border-neutral text-[9px] px-1.5 py-0.5 rounded-custom-sm shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none mb-1 z-20 whitespace-nowrap">
                        Inc: {formatCurrency(interval.income)} | Exp: {formatCurrency(interval.expenses)}
                      </div>

                      <div className="flex items-end gap-1 w-full h-full justify-center">
                        <div
                          className="w-2 md:w-3 bg-brand-purple rounded-t-custom-xs transition-all duration-300"
                          style={{ height: `${Math.max(incPct, 2)}%` }}
                        />
                        <div
                          className="w-2 md:w-3 bg-surface-secondary border border-border-neutral rounded-t-custom-xs transition-all duration-300"
                          style={{ height: `${Math.max(expPct, 2)}%` }}
                        />
                      </div>

                      <span className="text-[10px] text-text-secondary mt-2 text-center w-full truncate">
                        {interval.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* SECTION F — GOAL PROGRESS SUMMARY */}
        <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border-neutral/40">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Target size={18} className="text-brand-purple" /> Goal progress
            </h3>
            <Link to="/goals" className="text-xs font-bold text-brand-purple hover:underline">
              View All
            </Link>
          </div>

          {data.activeGoals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {data.activeGoals.slice(0, 4).map((goal) => {
                const contribs = data.goalContributions[goal.id] || []
                const saved = contribs.reduce((sum, c) => sum + Math.round(c.amount * 100), 0) / 100
                const progress = goal.target_amount > 0 ? (saved / goal.target_amount) * 100 : 0
                const remaining = Math.max(goal.target_amount - saved, 0)
                
                // Safe goal pace calculations
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
                  <div key={goal.id} className="space-y-3 bg-surface-secondary/40 border border-border-neutral/50 rounded-custom-lg p-4 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-bold text-text-primary">{goal.name}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-custom-full ${
                          pace === 'ahead'
                            ? 'bg-state-positive/10 text-state-positive'
                            : pace === 'behind'
                            ? 'bg-state-expense/10 text-state-expense animate-pulse'
                            : 'bg-brand-purple/10 text-brand-purple'
                        }`}>
                          {pace === 'ahead' ? 'Ahead' : pace === 'behind' ? 'Behind' : 'On Track'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-text-secondary pt-0.5">
                        <span>Target: {formatCurrency(goal.target_amount)}</span>
                        <span>Saved: {formatCurrency(saved)}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-brand-purple h-full rounded-full transition-all duration-300"
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
            <div className="py-6">
              <OverviewEmptyState type="no_goals" />
            </div>
          )}
        </div>
      </div>

      {/* MOBILE TRIGGER - SINGLE ADD BUTTON AT BOTTOM-RIGHT */}
      <div className="md:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => handleOpenQuickAdd('expense')}
          className="w-14 h-14 bg-brand-purple hover:bg-brand-purple/95 text-text-primary rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
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
