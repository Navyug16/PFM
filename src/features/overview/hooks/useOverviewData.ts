import { useState, useEffect, useCallback } from 'react'
import { useSettings } from '@/features/settings/hooks/useSettings'
import {
  listAccounts,
  listTransactions,
  listGoals,
  listGoalContributions,
  listCategories
} from '../../financial/api/financial-api'
import {
  calculateAvailableBalanceMulti,
  getSingleCurrencyNetPositionMulti,
  calculatePeriodIncomeMulti,
  calculatePeriodExpensesMulti,
  calculatePeriodSavingsMulti,
  calculateSavingsRateMulti,
  calculateTodaySpendingMulti,
  calculateAverageDailySpendingMulti,
  calculateCategorySpending,
  calculateCategoryShare,
  groupCashFlowByInterval
} from '../../financial/utils/calculations'
import { getPeriodBounds, getEquivalentPreviousPeriod } from '../../financial/utils/date-utils'
import { generateInsights } from '../utils/insight-engine'
import type { Account, Transaction, Goal, GoalContribution, Category } from '../../financial/types'
import type { PeriodOption, OverviewData } from '../types'

export const useOverviewData = (period: PeriodOption) => {
  const { profile } = useSettings()
  const primaryCurrency = profile?.currency || 'INR'

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
    try {
      setLoading(true)
      const [accounts, transactions, goals, categories] = await Promise.all([
        listAccounts(),
        listTransactions(),
        listGoals(),
        listCategories()
      ])

      // Load contributions per goal
      const contributions: { [goalId: string]: GoalContribution[] } = {}
      await Promise.all(
        goals.map(async (g) => {
          const list = await listGoalContributions(g.id)
          contributions[g.id] = list
        })
      )

      setRawData({
        accounts,
        transactions,
        goals,
        contributions,
        categories
      })
      setError(null)
    } catch (err: unknown) {
      console.error('Failed to load overview data:', err)
      setError(err instanceof Error ? err.message : 'Database fetch failure')
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

    // Current State (Stock Metrics) using Multi versions
    const availableBalance = calculateAvailableBalanceMulti(rawData.accounts, rawData.transactions)
    const netPosition = getSingleCurrencyNetPositionMulti(rawData.accounts, rawData.transactions)

    // Flow Metrics using Multi versions
    const periodIncome = calculatePeriodIncomeMulti(rawData.transactions, rawData.accounts, startDate, endDate)
    const periodExpenses = calculatePeriodExpensesMulti(rawData.transactions, rawData.accounts, startDate, endDate)
    const periodSavings = calculatePeriodSavingsMulti(rawData.transactions, rawData.accounts, startDate, endDate)
    const savingsRate = calculateSavingsRateMulti(periodIncome, periodExpenses)

    // Comparison Flow Metrics using Multi versions
    const prevPeriodIncome = calculatePeriodIncomeMulti(rawData.transactions, rawData.accounts, prevStartDate, prevEndDate)
    const prevPeriodExpenses = calculatePeriodExpensesMulti(rawData.transactions, rawData.accounts, prevStartDate, prevEndDate)
    const prevPeriodSavings = calculatePeriodSavingsMulti(rawData.transactions, rawData.accounts, prevStartDate, prevEndDate)
    const prevPeriodSavingsRate = calculateSavingsRateMulti(prevPeriodIncome, prevPeriodExpenses)

    // Today's Glance using Multi versions
    const todayExpenses = calculateTodaySpendingMulti(rawData.transactions, rawData.accounts, todayStr)
    const todayTxs = rawData.transactions.filter(
      (tx) => tx.transaction_date === todayStr && tx.transaction_type !== 'transfer'
    )
    const todayCount = todayTxs.length
    
    const accountCurrencyMap = new Map(rawData.accounts.map((a) => [a.id, a.currency_code.toUpperCase()]))
    const todayMaxExpense = todayTxs
      .filter((tx) => tx.transaction_type === 'expense' && accountCurrencyMap.get(tx.account_id) === primaryCurrency)
      .reduce<Transaction | null>((max, tx) => (!max || tx.amount > max.amount ? tx : max), null)
    
    const dailyAverage = calculateAverageDailySpendingMulti(
      rawData.transactions,
      rawData.accounts,
      startDate,
      endDate,
      todayStr
    )

    // Spending Category Share: only process primaryCurrency to ensure compatibility
    const primaryExpensesTotal = periodExpenses[primaryCurrency] || 0
    const primaryTransactions = rawData.transactions.filter(
      (tx) => accountCurrencyMap.get(tx.account_id) === primaryCurrency
    )
    const categorySpending = calculateCategorySpending(primaryTransactions, startDate, endDate)
    
    const categoryShare = Object.entries(categorySpending).map(([catId, amount]) => {
      const category = rawData.categories.find((c) => c.id === catId) || null
      const percentage = calculateCategoryShare(amount, primaryExpensesTotal)
      return { category, amount, percentage }
    }).sort((a, b) => b.amount - a.amount)

    // Cash Flow Intervals: filter to primaryCurrency transactions for charts
    const cashFlowIntervals = groupCashFlowByInterval(
      primaryTransactions,
      period,
      startDate,
      endDate
    )

    // Insight Priority List (pass primary currency for comparison logic)
    const insights = generateInsights(
      primaryTransactions,
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
export default useOverviewData
