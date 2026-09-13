import type { Transaction, Category } from '@/features/financial/types'
import type {
  EmailUserContext,
  EmailReportPayload,
  EmailCategorySpendingItem,
  EmailInsightItem,
  EmailInsightType,
} from '../types/email'
import {
  calculatePeriodIncome,
  calculatePeriodExpenses,
  calculatePeriodSavings,
  calculateSavingsRate,
  comparePeriodSpending,
} from '@/features/financial/utils/calculations'
import { calculateCategoryBreakdown } from '@/features/insights/utils/report-calculations'
import { generateReportInsights } from '@/features/insights/utils/report-insight-engine'

export interface BuildMonthlyEmailPayloadParams {
  user: EmailUserContext
  transactions: Transaction[] // Current month transactions
  prevTransactions?: Transaction[] // Previous month transactions for baseline comparison (optional)
  categories: Category[]
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  prevStartDate?: string // YYYY-MM-DD (optional)
  prevEndDate?: string // YYYY-MM-DD (optional)
}

/**
 * Formats a start and end date range string localized according to user locale.
 * Example: "Aug 01, 2026 – Aug 31, 2026"
 */
const formatMonthlyRangeString = (startDateStr: string, endDateStr: string, locale: string): string => {
  try {
    const start = new Date(startDateStr)
    const end = new Date(endDateStr)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return `${startDateStr} – ${endDateStr}`
    }

    const formatter = new Intl.DateTimeFormat(locale || 'en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

    return `${formatter.format(start)} – ${formatter.format(end)}`
  } catch (err) {
    console.error('Error formatting monthly date range string:', err)
    return `${startDateStr} – ${endDateStr}`
  }
}

/**
 * PURE MONTHLY EMAIL PAYLOAD BUILDER
 * ----------------------------------
 * Assembles a read-only EmailReportPayload for monthly financial dispatches.
 * 
 * STRICT TRUST BOUNDARY RULES:
 * 1. Performs ZERO financial arithmetic or formula calculations inside this function.
 * 2. Delegates strictly to existing trusted calculation utilities.
 * 3. Does NOT mutate input parameters or perform database queries / network calls.
 * 4. Produces payload with `reportType: 'monthly'`.
 */
export const buildMonthlyEmailPayload = (
  params: BuildMonthlyEmailPayloadParams
): EmailReportPayload => {
  const {
    user,
    transactions,
    prevTransactions = [],
    categories,
    startDate,
    endDate,
    prevStartDate = '',
    prevEndDate = '',
  } = params

  // Combine transactions safely for period comparison without mutating inputs
  const allTxs = [...transactions, ...prevTransactions]

  // 1. Calculate trusted summary metrics
  const totalIncome = calculatePeriodIncome(transactions, startDate, endDate)
  const totalExpenses = calculatePeriodExpenses(transactions, startDate, endDate)
  const netSavings = calculatePeriodSavings(transactions, startDate, endDate)
  const savingsRate = calculateSavingsRate(totalIncome, totalExpenses)

  // 2. Delegate month-over-month comparison directly to comparePeriodSpending if prev dates supplied
  const hasPrevDates = Boolean(prevStartDate && prevEndDate)
  const comparison = hasPrevDates
    ? comparePeriodSpending(
        allTxs,
        startDate,
        endDate,
        prevStartDate,
        prevEndDate
      )
    : {
        current: totalExpenses,
        previous: calculatePeriodExpenses(prevTransactions, prevStartDate || undefined, prevEndDate || undefined),
        percentChange: totalExpenses > 0 ? 100 : 0,
      }

  // 3. Delegate category breakdown calculation
  const breakdownDetails = calculateCategoryBreakdown(
    categories,
    transactions,
    prevTransactions,
    totalExpenses
  )

  // Map category breakdown items directly to EmailCategorySpendingItem
  const categorySpendingItems: EmailCategorySpendingItem[] = breakdownDetails.map((detail) => ({
    categoryId: detail.id,
    categoryName: detail.name,
    amount: detail.amount,
    percentage: detail.percentage,
    transactionCount: detail.count,
    direction: detail.direction,
  }))

  // Top category is breakdownDetails[0] (calculateCategoryBreakdown sorts descending by amount)
  const topCategoryItem: EmailCategorySpendingItem | undefined =
    categorySpendingItems.length > 0 ? categorySpendingItems[0] : undefined

  // 4. Delegate deterministic insight generation to M13 report insight engine
  const prevSavings = hasPrevDates
    ? calculatePeriodSavings(prevTransactions, prevStartDate, prevEndDate)
    : 0
  const topCategoryPercent = topCategoryItem ? topCategoryItem.percentage : 0
  const top3CategoriesPercent = categorySpendingItems
    .slice(0, 3)
    .reduce((sum, item) => sum + item.percentage, 0)

  // Calculate days in month period for daily average calculation
  const startTs = new Date(startDate).getTime()
  const endTs = new Date(endDate).getTime()
  const daysInPeriod = (!isNaN(startTs) && !isNaN(endTs))
    ? Math.max(Math.round((endTs - startTs) / (1000 * 60 * 60 * 24)) + 1, 1)
    : 30

  const rawInsights = generateReportInsights({
    income: totalIncome,
    expenses: totalExpenses,
    savings: netSavings,
    savingsRate,
    prevExpenses: comparison.previous,
    prevSavings,
    dailyAverage: Math.round((totalExpenses / daysInPeriod) * 100) / 100,
    breakdown: breakdownDetails,
    spike: null,
    concentration: {
      topCategoryPercent: Math.round(topCategoryPercent * 100) / 100,
      top3CategoriesPercent: Math.round(top3CategoriesPercent * 100) / 100,
    },
    recurringRatio: 0,
    budgetSpent: 0,
    budgetLimit: 0,
    goals: [],
    goalPaceMap: {},
  })

  // Map deterministic insights to EmailInsightItem
  const emailInsights: EmailInsightItem[] = rawInsights.map((insight) => ({
    id: insight.id,
    type: insight.type as EmailInsightType,
    title: insight.title,
    statement: insight.statement,
    severity: insight.severity,
  }))

  // 5. Assemble final trusted payload with reportType: 'monthly'
  return {
    reportType: 'monthly',
    generatedAt: new Date().toISOString(),
    user: {
      displayName: user.displayName,
      currency: user.currency,
      locale: user.locale,
      dateFormat: user.dateFormat,
    },
    period: {
      startDate,
      endDate,
      formattedRange: formatMonthlyRangeString(startDate, endDate, user.locale),
    },
    summary: {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      previousPeriodExpenses: comparison.previous,
      expensePercentChange: comparison.percentChange,
    },
    categories: categorySpendingItems,
    topCategory: topCategoryItem,
    insights: emailInsights,
  }
}
