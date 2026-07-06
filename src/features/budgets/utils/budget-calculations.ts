/**
 * Pure calculation utilities for the PFM Budget Planning Engine (Milestone 5).
 * Follows the strict date-counting convention: Today is included in both elapsed and remaining.
 */

// Helper to count calendar days between two ISO dates inclusive
const getDaysBetween = (startStr: string, endStr: string): number => {
  const dStart = new Date(startStr)
  const dEnd = new Date(endStr)
  const diffTime = dEnd.getTime() - dStart.getTime()
  if (diffTime < 0) return 0
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1
}

// 1. Calculate safe day counts matching date-counting convention
export interface BudgetDaysResult {
  totalDays: number
  elapsedDays: number
  remainingDays: number
}

export const calculateBudgetDaysCounts = (
  startDate: string,
  endDate: string,
  today: string
): BudgetDaysResult => {
  const totalDays = getDaysBetween(startDate, endDate)
  
  if (today < startDate) {
    return {
      totalDays,
      elapsedDays: 0,
      remainingDays: totalDays,
    }
  }
  if (today > endDate) {
    return {
      totalDays,
      elapsedDays: totalDays,
      remainingDays: 0,
    }
  }

  const elapsedDays = getDaysBetween(startDate, today)
  const remainingDays = getDaysBetween(today, endDate)

  return {
    totalDays,
    elapsedDays,
    remainingDays,
  }
}

// 2. Budget Spent: sum of expense transactions in period bounds
export const calculateBudgetSpent = (
  transactions: { transaction_type: string; amount: number; transaction_date: string }[],
  startDate: string,
  endDate: string
): number => {
  const spentCents = transactions
    .filter(
      (tx) =>
        tx.transaction_type === 'expense' &&
        tx.transaction_date >= startDate &&
        tx.transaction_date <= endDate
    )
    .reduce((sum, tx) => sum + Math.round(tx.amount * 100), 0)
  return spentCents / 100
}

// 3. Budget Remaining (Allows negative values to indicate overspending)
export const calculateBudgetRemaining = (limit: number, spent: number): number => {
  const limitCents = Math.round(limit * 100)
  const spentCents = Math.round(spent * 100)
  return (limitCents - spentCents) / 100
}

// 4. Budget Usage Percentage
export const calculateBudgetUsagePercentage = (spent: number, limit: number): number => {
  if (limit <= 0) return 0
  const usage = (spent / limit) * 100
  return Math.round(usage * 100) / 100
}

// 5. Category Budget Spent
export const calculateCategoryBudgetSpent = (
  transactions: { transaction_type: string; amount: number; transaction_date: string; category_id?: string | null }[],
  categoryId: string,
  startDate: string,
  endDate: string
): number => {
  const spentCents = transactions
    .filter(
      (tx) =>
        tx.transaction_type === 'expense' &&
        tx.category_id === categoryId &&
        tx.transaction_date >= startDate &&
        tx.transaction_date <= endDate
    )
    .reduce((sum, tx) => sum + Math.round(tx.amount * 100), 0)
  return spentCents / 100
}

// 6. Category Budget Remaining
export const calculateCategoryBudgetRemaining = (allocatedAmount: number, spent: number): number => {
  return calculateBudgetRemaining(allocatedAmount, spent)
}

// 7. Category Budget Usage Percentage
export const calculateCategoryBudgetUsagePercentage = (spent: number, allocatedAmount: number): number => {
  return calculateBudgetUsagePercentage(spent, allocatedAmount)
}

// 8. Daily Safe to Spend Allowance (clamped at zero for display allowance)
export const calculateDailySafeToSpend = (remainingAmount: number, remainingDays: number): number => {
  if (remainingDays <= 0) return 0
  const safeCents = Math.max(remainingAmount, 0) * 100
  return Math.round((safeCents / remainingDays)) / 100
}

// 9. Projected Period Spending
export const calculateProjectedPeriodSpending = (
  spentAmount: number,
  elapsedDays: number,
  totalDays: number
): number => {
  if (elapsedDays <= 0) return spentAmount
  const spentCents = Math.round(spentAmount * 100)
  const projectedCents = (spentCents / elapsedDays) * totalDays
  return Math.round(projectedCents) / 100
}

// 10. Projected Budget Variance
export const calculateProjectedBudgetVariance = (limit: number, projectedSpending: number): number => {
  const limitCents = Math.round(limit * 100)
  const projectedCents = Math.round(projectedSpending * 100)
  return (limitCents - projectedCents) / 100
}

// 11. Hybrid Budget Pace Status
export type BudgetPaceStatus = 'safe' | 'watch' | 'at_risk' | 'exceeded' | 'unavailable'

export const calculateBudgetPaceStatus = (
  limit: number,
  spent: number,
  elapsedDays: number,
  totalDays: number,
  transactionCount: number = 3
): BudgetPaceStatus => {
  if (limit <= 0 || totalDays <= 0 || elapsedDays < 0) return 'unavailable'
  if (spent > limit) return 'exceeded'

  // Projections Safeguard: prevent noise early in the period
  if (elapsedDays < 3) {
    return 'safe'
  }
  // Low-spending transaction volume safeguard: only trigger if spent is under 50% of limit
  if (spent < limit * 0.50 && transactionCount < 3) {
    return 'safe'
  }

  const elapsedRatio = elapsedDays / totalDays
  const expectedSpent = limit * elapsedRatio

  const projectedSpending = calculateProjectedPeriodSpending(spent, elapsedDays, totalDays)
  const projectedVariance = calculateProjectedBudgetVariance(limit, projectedSpending)

  if (spent > expectedSpent) {
    // Over projected limit check: compare variance against 10% threshold
    if (projectedVariance < -0.10 * limit) {
      return 'at_risk'
    }
    if (projectedVariance < 0.00) {
      return 'watch'
    }
  }

  return 'safe'
}
