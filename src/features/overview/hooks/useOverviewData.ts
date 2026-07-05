import { useState, useEffect, useCallback } from 'react'
import {
  listAccounts,
  listTransactions,
  listGoals,
  listGoalContributions,
  listCategories
} from '../../financial/api/financial-api'
import {
  calculateAvailableBalance,
  getSingleCurrencyNetPosition,
  calculatePeriodIncome,
  calculatePeriodExpenses,
  calculatePeriodSavings,
  calculateSavingsRate,
  calculateTodaySpending,
  calculateAverageDailySpending,
  calculateCategorySpending,
  calculateCategoryShare,
  groupCashFlowByInterval
} from '../../financial/utils/calculations'
import { getPeriodBounds, getEquivalentPreviousPeriod } from '../../financial/utils/date-utils'
import { generateInsights } from '../utils/insight-engine'
import type { Account, Transaction, Goal, GoalContribution, Category } from '../../financial/types'
import type { PeriodOption, OverviewData } from '../types'

export const useOverviewData = (period: PeriodOption) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rawData, setRawData] = useState<{
    accounts: Account[]
    transactions: Transaction[]
    goals: Goal[]
    contributions: { [goalId: string]: GoalContribution[] }
    categories: Category[]
  } | null>(null)

  const fetchRawData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch main financial foundation (Accounts, Transactions, Categories)
      const [accounts, transactions, categories] = await Promise.all([
        listAccounts(),
        listTransactions(), // Note: Fetching full history is a derived-balance limitation. Optimized balance tables can be added in later milestones.
        listCategories(),
      ])

      // 2. Fetch goals and goal contributions in parallel (resilient secondary fail path)
      let goals: Goal[] = []
      const contributions: { [goalId: string]: GoalContribution[] } = {}
      try {
        const goalsList = await listGoals()
        goals = goalsList.filter((g) => g.status === 'active')
        await Promise.all(
          goals.map(async (g) => {
            const contribs = await listGoalContributions(g.id)
            contributions[g.id] = contribs
          })
        )
      } catch (goalErr) {
        console.error('Secondary goals loading failed:', goalErr)
        // Secondary section failure does not destroy the main dashboard loading state
      }

      setRawData({ accounts, transactions, goals, contributions, categories })
    } catch (err: unknown) {
      console.error('Critical Overview loading failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to retrieve financial ledger data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    const run = async () => {
      await Promise.resolve()
      if (active) {
        fetchRawData()
      }
    }
    run()
    return () => {
      active = false
    }
  }, [fetchRawData])

  // Compute period specific metrics reactively from rawData in memory
  let overviewData: OverviewData | null = null

  if (rawData) {
    const todayStr = new Date().toISOString().split('T')[0]
    
    // Bounds calculations
    const { start: startDate, end: endDate } = getPeriodBounds(period)
    const { start: prevStartDate, end: prevEndDate } = getEquivalentPreviousPeriod(
      startDate,
      endDate,
      period
    )

    // Current State (Stock Metrics)
    const availableBalance = calculateAvailableBalance(rawData.accounts, rawData.transactions)
    const netPosition = getSingleCurrencyNetPosition(rawData.accounts, rawData.transactions)

    // Flow Metrics
    const periodIncome = calculatePeriodIncome(rawData.transactions, startDate, endDate)
    const periodExpenses = calculatePeriodExpenses(rawData.transactions, startDate, endDate)
    const periodSavings = calculatePeriodSavings(rawData.transactions, startDate, endDate)
    const savingsRate = calculateSavingsRate(periodIncome, periodExpenses)

    // Comparison Flow Metrics
    const prevPeriodIncome = calculatePeriodIncome(rawData.transactions, prevStartDate, prevEndDate)
    const prevPeriodExpenses = calculatePeriodExpenses(rawData.transactions, prevStartDate, prevEndDate)
    const prevPeriodSavings = calculatePeriodSavings(rawData.transactions, prevStartDate, prevEndDate)
    const prevPeriodSavingsRate = calculateSavingsRate(prevPeriodIncome, prevPeriodExpenses)

    // Today's Glance
    const todayExpenses = calculateTodaySpending(rawData.transactions, todayStr)
    const todayTxs = rawData.transactions.filter(
      (tx) => tx.transaction_date === todayStr && tx.transaction_type !== 'transfer'
    )
    const todayCount = todayTxs.length
    const todayMaxExpense = todayTxs
      .filter((tx) => tx.transaction_type === 'expense')
      .reduce<Transaction | null>((max, tx) => (!max || tx.amount > max.amount ? tx : max), null)
    
    const dailyAverage = calculateAverageDailySpending(
      rawData.transactions,
      startDate,
      endDate,
      todayStr
    )

    // Spending Category Share
    const categorySpending = calculateCategorySpending(rawData.transactions, startDate, endDate)
    const categoryShare = Object.entries(categorySpending).map(([catId, amount]) => {
      const category = rawData.categories.find((c) => c.id === catId) || null
      const percentage = calculateCategoryShare(amount, periodExpenses)
      return { category, amount, percentage }
    }).sort((a, b) => b.amount - a.amount)

    // Cash Flow Intervals
    const cashFlowIntervals = groupCashFlowByInterval(
      rawData.transactions,
      period,
      startDate,
      endDate
    )

    // Insight Priority List
    const insights = generateInsights(
      rawData.transactions,
      rawData.categories,
      rawData.goals,
      rawData.contributions,
      startDate,
      endDate,
      prevStartDate,
      prevEndDate,
      todayStr
    )

    overviewData = {
      accounts: rawData.accounts,
      transactions: rawData.transactions,
      activeGoals: rawData.goals,
      goalContributions: rawData.contributions,
      categories: rawData.categories,
      availableBalance,
      netPosition,
      periodIncome,
      periodExpenses,
      periodSavings,
      savingsRate,
      prevPeriodIncome,
      prevPeriodExpenses,
      prevPeriodSavings,
      prevPeriodSavingsRate,
      todayExpenses,
      todayCount,
      todayMaxExpense,
      dailyAverage,
      categoryShare,
      cashFlowIntervals,
      insights
    }
  }

  return {
    loading,
    error,
    data: overviewData,
    refetch: fetchRawData
  }
}
