import { useState, useEffect, useCallback } from 'react'
import { getActiveBudget } from '../api/budgets-api'
import { listTransactions, listCategories } from '../../financial/api/financial-api'
import {
  calculateBudgetDaysCounts,
  calculateBudgetSpent,
  calculateBudgetRemaining,
  calculateBudgetUsagePercentage,
  calculateCategoryBudgetSpent,
  calculateCategoryBudgetRemaining,
  calculateCategoryBudgetUsagePercentage,
  calculateDailySafeToSpend,
  calculateProjectedPeriodSpending,
  calculateProjectedBudgetVariance,
  calculateBudgetPaceStatus
} from '../utils/budget-calculations'
import type { BudgetWithAllocations } from '../types'
import type { Transaction, Category } from '../../financial/types'

export interface CategoryBudgetDetails {
  categoryId: string
  categoryName: string
  categoryIcon: string | null
  allocated: number
  spent: number
  remaining: number
  usagePercentage: number
  paceStatus: 'safe' | 'watch' | 'at_risk' | 'exceeded' | 'unavailable'
}

export interface BudgetDataResult {
  loading: boolean
  error: string | null
  activeBudget: BudgetWithAllocations | null
  spent: number
  remaining: number
  usagePercentage: number
  dailySafeToSpend: number
  projectedSpending: number
  projectedVariance: number
  paceStatus: 'safe' | 'watch' | 'at_risk' | 'exceeded' | 'unavailable'
  daysCounts: { totalDays: number; elapsedDays: number; remainingDays: number }
  categoryBreakdown: CategoryBudgetDetails[]
  uncategorizedSpending: number
  totalAllocatedAmount: number
  totalUnallocatedAmount: number
  refetch: () => Promise<void>
  expenseCategories: Category[]
}

export const useBudgetData = (): BudgetDataResult => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [activeBudget, setActiveBudget] = useState<BudgetWithAllocations | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([])

  const fetchDetails = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [budget, txs, allCategories] = await Promise.all([
        getActiveBudget(),
        listTransactions(),
        listCategories(),
      ])

      setActiveBudget(budget)
      setTransactions(txs)
      
      // Keep only expense categories
      const expensesOnly = allCategories.filter((c) => c.transaction_type === 'expense')
      setExpenseCategories(expensesOnly)
    } catch (err: unknown) {
      console.error('Error fetching budget context details:', err)
      setError(err instanceof Error ? err.message : 'Failed to retrieve active budget data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    const run = async () => {
      await Promise.resolve()
      if (active) {
        fetchDetails()
      }
    }
    run()
    return () => {
      active = false
    }
  }, [fetchDetails])

  // If no active budget, return default empty payload
  if (!activeBudget) {
    return {
      loading,
      error,
      activeBudget: null,
      spent: 0,
      remaining: 0,
      usagePercentage: 0,
      dailySafeToSpend: 0,
      projectedSpending: 0,
      projectedVariance: 0,
      paceStatus: 'unavailable',
      daysCounts: { totalDays: 0, elapsedDays: 0, remainingDays: 0 },
      categoryBreakdown: [],
      uncategorizedSpending: 0,
      totalAllocatedAmount: 0,
      totalUnallocatedAmount: 0,
      refetch: fetchDetails,
      expenseCategories,
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const { start_date: startDate, end_date: endDate, total_limit: limit } = activeBudget

  // Calculate day metrics
  const daysCounts = calculateBudgetDaysCounts(startDate, endDate, todayStr)

  // Calculate overall spending
  const spent = calculateBudgetSpent(transactions, startDate, endDate)
  const remaining = calculateBudgetRemaining(limit, spent)
  const usagePercentage = calculateBudgetUsagePercentage(spent, limit)

  const dailySafeToSpend = calculateDailySafeToSpend(remaining, daysCounts.remainingDays)
  const projectedSpending = calculateProjectedPeriodSpending(spent, daysCounts.elapsedDays, daysCounts.totalDays)
  const projectedVariance = calculateProjectedBudgetVariance(limit, projectedSpending)

  // Filter transactions for this period
  const periodTxs = transactions.filter(
    (tx) => tx.transaction_date >= startDate && tx.transaction_date <= endDate && tx.transaction_type === 'expense'
  )

  const paceStatus = calculateBudgetPaceStatus(
    limit,
    spent,
    daysCounts.elapsedDays,
    daysCounts.totalDays,
    periodTxs.length
  )

  // Category allocated totals
  const totalAllocatedAmount = activeBudget.allocations.reduce(
    (sum, alloc) => sum + alloc.allocated_amount,
    0
  )
  const categoryBreakdown: CategoryBudgetDetails[] = activeBudget.allocations.map((alloc) => {

    const catSpent = calculateCategoryBudgetSpent(transactions, alloc.category_id, startDate, endDate)
    const catRemaining = calculateCategoryBudgetRemaining(alloc.allocated_amount, catSpent)
    const catUsage = calculateCategoryBudgetUsagePercentage(catSpent, alloc.allocated_amount)

    const catTxs = periodTxs.filter((tx) => tx.category_id === alloc.category_id)
    const catPace = calculateBudgetPaceStatus(
      alloc.allocated_amount,
      catSpent,
      daysCounts.elapsedDays,
      daysCounts.totalDays,
      catTxs.length
    )

    return {
      categoryId: alloc.category_id,
      categoryName: alloc.category_name || 'Unspecified',
      categoryIcon: alloc.category_icon || null,
      allocated: alloc.allocated_amount,
      spent: catSpent,
      remaining: catRemaining,
      usagePercentage: catUsage,
      paceStatus: catPace,
    }
  })

  // Calculate uncategorized spending (expenses logged under categories not allocated in the active budget)
  const allocatedCatIds = new Set(activeBudget.allocations.map((a) => a.category_id))
  
  const uncategorizedSpentCents = periodTxs
    .filter((tx) => !tx.category_id || !allocatedCatIds.has(tx.category_id))
    .reduce((sum, tx) => sum + Math.round(tx.amount * 100), 0)
  
  const uncategorizedSpending = uncategorizedSpentCents / 100
  const totalUnallocatedAmount = Math.max(limit - totalAllocatedAmount, 0)

  return {
    loading,
    error,
    activeBudget,
    spent,
    remaining,
    usagePercentage,
    dailySafeToSpend,
    projectedSpending,
    projectedVariance,
    paceStatus,
    daysCounts,
    categoryBreakdown,
    uncategorizedSpending,
    totalAllocatedAmount,
    totalUnallocatedAmount,
    refetch: fetchDetails,
    expenseCategories,
  }
}
