import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Transaction, Account, Category, Goal, GoalContribution, Budget } from '@/features/financial/types'
import type { RecurringOccurrence } from '@/features/transactions/types/recurring'
import {
  getReportPeriodBounds,
  getReportComparisonBounds
} from '@/features/financial/utils/date-utils'
import type { ReportPeriodPreset } from '@/features/financial/utils/date-utils'
import {
  calculateCategoryBreakdown,
  calculateMerchantRankings,
  groupTrendPoints,
  calculateAverageDailySpending,
  detectDailyVolatilitySpike,
  calculateExpenseConcentration,
  calculateRecurringExpenseRatio,
  calculateIndianFYReview
} from '../utils/report-calculations'
import type {
  CategoryBreakdownDetail,
  MerchantDetail,
  TrendPoint,
  IndianFYReview
} from '../utils/report-calculations'
import { generateReportInsights } from '../utils/report-insight-engine'
import type { FinancialInsight } from '../utils/report-insight-engine'
import { calculateGoalSavedAmount, calculateGoalPaceStatus } from '@/features/financial/utils/calculations'

export interface InsightsData {
  start: string
  end: string
  prevStart: string
  prevEnd: string
  income: number
  expenses: number
  savings: number
  savingsRate: number
  prevIncome: number
  prevExpenses: number
  prevSavings: number
  prevSavingsRate: number
  dailyAverage: number
  transactionCount: number
  categoriesBreakdown: CategoryBreakdownDetail[]
  merchantRankings: MerchantDetail[]
  trendPoints: TrendPoint[]
  monthlySavingsTrend: TrendPoint[]
  spike: { spikeDate: string; amount: number; ratio: number } | null
  concentration: { topCategoryPercent: number; top3CategoriesPercent: number }
  recurringRatio: number
  insights: FinancialInsight[]
  fyReview: IndianFYReview | null
  // Raw lists for CSV Exports
  rawTransactions: Transaction[]
  rawAccounts: Account[]
  rawCategories: Category[]
  rawGoals: Goal[]
  rawContributionsMap: { [goalId: string]: GoalContribution[] }
  todayStr: string
}

export const useInsightsData = (
  preset: ReportPeriodPreset,
  customStart?: string,
  customEnd?: string
) => {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]

      // 1. Get dates bounds
      const { start, end } = getReportPeriodBounds(preset, today, customStart, customEnd)
      const { start: prevStart, end: prevEnd } = getReportComparisonBounds(preset, start, end)

      const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime())
      const elapsedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

      // 2. Fetch all required tables in parallel to prevent N+1 queries
      const [
        { data: accountsList, error: accountsErr },
        { data: categoriesList, error: categoriesErr },
        { data: allTransactions, error: txsErr },
        { data: goalsList, error: goalsErr },
        { data: contributionsList, error: contribsErr },
        { data: budgetsList, error: budgetsErr },
        { data: occurrencesList, error: occsErr }
      ] = await Promise.all([
        supabase.from('accounts').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('transactions').select('*').order('transaction_date', { ascending: false }),
        supabase.from('goals').select('*'),
        supabase.from('goal_contributions').select('*'),
        supabase.from('budgets').select('*'),
        supabase.from('recurring_occurrences').select('*').eq('status', 'confirmed')
      ])

      if (accountsErr) throw new Error(accountsErr.message)
      if (categoriesErr) throw new Error(categoriesErr.message)
      if (txsErr) throw new Error(txsErr.message)
      if (goalsErr) throw new Error(goalsErr.message)
      if (contribsErr) throw new Error(contribsErr.message)
      if (budgetsErr) throw new Error(budgetsErr.message)
      if (occsErr) throw new Error(occsErr.message)

      const accounts: Account[] = accountsList || []
      const categories: Category[] = categoriesList || []
      const transactions: Transaction[] = allTransactions || []
      const goals: Goal[] = goalsList || []
      const contributions: GoalContribution[] = contributionsList || []
      const budgets: Budget[] = budgetsList || []

      const confirmedOccurrences: RecurringOccurrence[] = occurrencesList || []

      // Filter transactions by period (excluding transfers from income/expense sums)
      const currentPeriodTxs = transactions.filter(
        (tx) => tx.transaction_date >= start && tx.transaction_date <= end
      )
      const prevPeriodTxs = transactions.filter(
        (tx) => tx.transaction_date >= prevStart && tx.transaction_date <= prevEnd
      )

      // Period Summary Metrics
      const income = currentPeriodTxs
        .filter((tx) => tx.transaction_type === 'income')
        .reduce((sum, tx) => sum + Math.round(tx.amount * 100), 0) / 100
      
      const expenses = currentPeriodTxs
        .filter((tx) => tx.transaction_type === 'expense')
        .reduce((sum, tx) => sum + Math.round(tx.amount * 100), 0) / 100

      const savings = income - expenses
      const savingsRate = income > 0 ? (savings / income) * 100 : 0

      // Previous Period Summary Metrics
      const prevIncome = prevPeriodTxs
        .filter((tx) => tx.transaction_type === 'income')
        .reduce((sum, tx) => sum + Math.round(tx.amount * 100), 0) / 100
      
      const prevExpenses = prevPeriodTxs
        .filter((tx) => tx.transaction_type === 'expense')
        .reduce((sum, tx) => sum + Math.round(tx.amount * 100), 0) / 100

      const prevSavings = prevIncome - prevExpenses
      const prevSavingsRate = prevIncome > 0 ? (prevSavings / prevIncome) * 100 : 0

      // Map previous category spending for comparison
      const prevCategoryAmounts: { [catId: string]: number } = {}
      prevPeriodTxs
        .filter((tx) => tx.transaction_type === 'expense' && tx.category_id)
        .forEach((tx) => {
          const catId = tx.category_id!
          prevCategoryAmounts[catId] = (prevCategoryAmounts[catId] || 0) + tx.amount
        })

      // Category breakdown
      const breakdown = calculateCategoryBreakdown(categories, currentPeriodTxs, prevPeriodTxs, expenses, prevCategoryAmounts)

      // Merchant rankings
      const merchantRankings = calculateMerchantRankings(currentPeriodTxs, expenses, 10)

      // Trend intervals
      const trendPoints = groupTrendPoints(currentPeriodTxs, start, end)

      // Monthly savings trend points (across full ledger range for trend visualization)
      const monthlySavingsTrend = transactions.length > 0
        ? groupTrendPoints(transactions, transactions[transactions.length - 1].transaction_date, todayStr)
            .filter((p) => p.label.includes(' ')) // Keeps only monthly intervals (format: "Month YY")
        : []

      // Daily Average Spending
      const dailyAverage = calculateAverageDailySpending(expenses, elapsedDays)

      // Volatility Spikes
      const spike = detectDailyVolatilitySpike(currentPeriodTxs, dailyAverage, elapsedDays)

      // Concentration metrics
      const concentration = calculateExpenseConcentration(breakdown)

      // Confirmed recurring transactions set
      const confirmedTxIds = confirmedOccurrences
        .filter((o) => o.transaction_id)
        .map((o) => o.transaction_id!)

      // Recurring ratio
      const recurringRatio = calculateRecurringExpenseRatio(currentPeriodTxs, confirmedTxIds)

      // Goal paces
      const contributionsMap: { [goalId: string]: GoalContribution[] } = {}
      contributions.forEach((c) => {
        contributionsMap[c.goal_id] = contributionsMap[c.goal_id] || []
        contributionsMap[c.goal_id].push(c)
      })

      const goalPaceMap: { [goalId: string]: 'ahead' | 'on_pace' | 'behind' } = {}
      goals.forEach((g) => {
        const saved = calculateGoalSavedAmount(contributionsMap[g.id] || [])
        goalPaceMap[g.id] = calculateGoalPaceStatus({
          startDate: g.start_date,
          targetDate: g.target_date,
          targetAmount: g.target_amount,
          savedAmount: saved,
          today: todayStr
        })
      })

      // Budget allocations context
      const activeBudget = budgets.find((b) => b.is_active)
      const budgetSpent = activeBudget
        ? currentPeriodTxs
            .filter((tx) => tx.transaction_type === 'expense')
            .reduce((sum, tx) => sum + Math.round(tx.amount * 100), 0) / 100
        : 0
      const budgetLimit = activeBudget ? activeBudget.total_limit : 0

      // Financial Insights rules matching
      const insightsList = generateReportInsights({
        income,
        expenses,
        savings,
        savingsRate,
        prevExpenses,
        prevSavings,
        dailyAverage,
        breakdown,
        spike,
        concentration,
        recurringRatio,
        budgetSpent,
        budgetLimit,
        goals,
        goalPaceMap
      })

      // Indian Financial Year aggregate Review
      let fyReview: IndianFYReview | null = null
      if (preset === 'indian_financial_year') {
        fyReview = calculateIndianFYReview(transactions, categories, contributions, start, end)
      }

      setData({
        start,
        end,
        prevStart,
        prevEnd,
        income,
        expenses,
        savings,
        savingsRate,
        prevIncome,
        prevExpenses,
        prevSavings,
        prevSavingsRate,
        dailyAverage,
        transactionCount: currentPeriodTxs.length,
        categoriesBreakdown: breakdown,
        merchantRankings,
        trendPoints,
        monthlySavingsTrend,
        spike,
        concentration,
        recurringRatio,
        insights: insightsList,
        fyReview,
        rawTransactions: transactions,
        rawAccounts: accounts,
        rawCategories: categories,
        rawGoals: goals,
        rawContributionsMap: contributionsMap,
        todayStr
      })
    } catch (err: unknown) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to compile report summaries.')
    } finally {
      setLoading(false)
    }
  }, [preset, customStart, customEnd])

  useEffect(() => {
    let active = true
    const run = async () => {
      await Promise.resolve()
      if (active) {
        fetchData()
      }
    }
    run()
    return () => {
      active = false
    }
  }, [fetchData])

  return { loading, error, data, refetch: fetchData }
}
