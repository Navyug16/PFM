import type { Transaction, Category } from '@/features/financial/types'
import {
  calculatePeriodIncome,
  calculatePeriodExpenses,
  calculatePeriodSavings,
  calculateSavingsRate,
  calculatePeriodComparison
} from '@/features/financial/utils/calculations'

export interface CategoryBreakdownDetail {
  id: string
  name: string
  icon: string | null
  amount: number
  percentage: number
  count: number
  average: number
  absoluteChange: number
  percentageChange: number
  percentChangeAvailable: boolean
  direction: 'up' | 'down' | 'unchanged' | 'unavailable'
}

export interface MerchantDetail {
  name: string
  amount: number
  count: number
  percentage: number
}

export interface TrendPoint {
  label: string
  income: number
  expenses: number
  savings: number
  savingsRate: number
}

/**
 * 1. Calculates category-wise expense breakdown, comparing against previous period
 */
export const calculateCategoryBreakdown = (
  categories: Category[],
  transactions: Transaction[],
  prevTransactions: Transaction[],
  totalExpenses: number,
  prevCategoryAmounts: { [catId: string]: number } = {}
): CategoryBreakdownDetail[] => {
  const expenseCategories = categories.filter((c) => c.transaction_type === 'expense')
  const totalExpensesCents = Math.round(totalExpenses * 100)

  // Aggregate current period category spending
  const currentCategoryCents: { [catId: string]: number } = {}
  const currentCategoryCount: { [catId: string]: number } = {}

  transactions
    .filter((tx) => tx.transaction_type === 'expense' && tx.category_id)
    .forEach((tx) => {
      const catId = tx.category_id!
      const amtCents = Math.round(tx.amount * 100)
      currentCategoryCents[catId] = (currentCategoryCents[catId] || 0) + amtCents
      currentCategoryCount[catId] = (currentCategoryCount[catId] || 0) + 1
    })

  // Group and map results
  return expenseCategories
    .map((cat) => {
      const currentCents = currentCategoryCents[cat.id] || 0
      const currentAmount = currentCents / 100
      const count = currentCategoryCount[cat.id] || 0
      const average = count > 0 ? Math.round((currentCents / count)) / 100 : 0
      const percentage = totalExpensesCents > 0 ? (currentCents / totalExpensesCents) * 100 : 0

      // Get previous amount
      const prevAmount = prevCategoryAmounts[cat.id] || 0

      // Comparison calculations
      const comparison = calculatePeriodComparison(currentAmount, prevAmount, prevAmount > 0 || currentAmount > 0)

      return {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        amount: currentAmount,
        percentage: Math.round(percentage * 100) / 100,
        count,
        average,
        absoluteChange: comparison.absoluteChange,
        percentageChange: comparison.percentageChange,
        percentChangeAvailable: comparison.percentChangeAvailable,
        direction: comparison.direction,
      }
    })
    .filter((detail) => detail.amount > 0) // Filter out categories with zero spending
    .sort((a, b) => b.amount - a.amount)
}

/**
 * 2. Compiles Merchant / Payee spending rankings
 */
export const calculateMerchantRankings = (
  transactions: Transaction[],
  totalExpenses: number,
  limit: 5 | 10 = 5
): MerchantDetail[] => {
  const expenseTxs = transactions.filter((tx) => tx.transaction_type === 'expense')
  const totalCents = Math.round(totalExpenses * 100)

  const merchantCents: { [name: string]: number } = {}
  const merchantCount: { [name: string]: number } = {}

  expenseTxs.forEach((tx) => {
    const rawPayee = tx.payee_or_source ? tx.payee_or_source.trim() : ''
    const payeeName = rawPayee || 'Unspecified Payee'
    const amtCents = Math.round(tx.amount * 100)
    merchantCents[payeeName] = (merchantCents[payeeName] || 0) + amtCents
    merchantCount[payeeName] = (merchantCount[payeeName] || 0) + 1
  })

  return Object.keys(merchantCents)
    .map((name) => {
      const cents = merchantCents[name]
      const percentage = totalCents > 0 ? (cents / totalCents) * 100 : 0
      return {
        name,
        amount: cents / 100,
        count: merchantCount[name],
        percentage: Math.round(percentage * 100) / 100,
      }
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit)
}

/**
 * Helper to group date range into daily, weekly, or monthly intervals
 */
export const groupTrendPoints = (
  transactions: Transaction[],
  startDate: string,
  endDate: string
): TrendPoint[] => {
  const dStart = new Date(startDate)
  const dEnd = new Date(endDate)
  const oneDay = 24 * 60 * 60 * 1000
  const diffDays = Math.ceil((dEnd.getTime() - dStart.getTime()) / oneDay) + 1

  const filterInRange = (tx: Transaction, startStr: string, endStr: string) => {
    return tx.transaction_date >= startStr && tx.transaction_date <= endStr
  }

  // A. Daily Grouping: for periods of 14 days or less
  if (diffDays <= 14) {
    const points: TrendPoint[] = []
    const temp = new Date(dStart)
    for (let i = 0; i < diffDays; i++) {
      const dateStr = temp.toISOString().split('T')[0]
      const label = temp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

      const inRangeTxs = transactions.filter((tx) => tx.transaction_date === dateStr)
      const income = calculatePeriodIncome(inRangeTxs, dateStr, dateStr)
      const expenses = calculatePeriodExpenses(inRangeTxs, dateStr, dateStr)
      const savings = calculatePeriodSavings(inRangeTxs, dateStr, dateStr)
      const savingsRate = calculateSavingsRate(income, expenses)

      points.push({ label, income, expenses, savings, savingsRate })
      temp.setDate(temp.getDate() + 1)
    }
    return points
  }

  // B. Weekly Grouping: for periods up to 60 days
  if (diffDays <= 60) {
    const points: TrendPoint[] = []
    const temp = new Date(dStart)
    let weekNum = 1

    while (temp <= dEnd) {
      const wStartStr = temp.toISOString().split('T')[0]
      const wEnd = new Date(temp)
      wEnd.setDate(wEnd.getDate() + 6)
      if (wEnd > dEnd) wEnd.setTime(dEnd.getTime())
      const wEndStr = wEnd.toISOString().split('T')[0]

      const label = `W${weekNum} (${temp.getDate()}/${temp.getMonth() + 1})`
      const inRangeTxs = transactions.filter((tx) => filterInRange(tx, wStartStr, wEndStr))
      const income = calculatePeriodIncome(inRangeTxs, wStartStr, wEndStr)
      const expenses = calculatePeriodExpenses(inRangeTxs, wStartStr, wEndStr)
      const savings = calculatePeriodSavings(inRangeTxs, wStartStr, wEndStr)
      const savingsRate = calculateSavingsRate(income, expenses)

      points.push({ label, income, expenses, savings, savingsRate })
      temp.setDate(temp.getDate() + 7)
      weekNum++
    }
    return points
  }

  // C. Monthly Grouping: for periods over 60 days
  const points: TrendPoint[] = []
  const temp = new Date(dStart)
  // Ensure calendar month alignment (e.g. Dec -> Jan transitions)
  temp.setDate(15) // Avoid timezone roll-offs

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  while (temp.getFullYear() < dEnd.getFullYear() || (temp.getFullYear() === dEnd.getFullYear() && temp.getMonth() <= dEnd.getMonth())) {
    const y = temp.getFullYear()
    const m = temp.getMonth()

    const label = `${monthNames[m]} ${String(y).slice(-2)}`
    const monthStart = new Date(y, m, 1).toISOString().split('T')[0]
    const monthEnd = new Date(y, m + 1, 0).toISOString().split('T')[0]

    const inRangeTxs = transactions.filter((tx) => filterInRange(tx, monthStart, monthEnd))
    const income = calculatePeriodIncome(inRangeTxs, monthStart, monthEnd)
    const expenses = calculatePeriodExpenses(inRangeTxs, monthStart, monthEnd)
    const savings = calculatePeriodSavings(inRangeTxs, monthStart, monthEnd)
    const savingsRate = calculateSavingsRate(income, expenses)

    points.push({ label, income, expenses, savings, savingsRate })
    temp.setMonth(temp.getMonth() + 1)
  }

  return points
}

/**
 * 4. Average Daily Spending (divides expenses by actual elapsed days)
 */
export const calculateAverageDailySpending = (expenses: number, elapsedDays: number): number => {
  if (elapsedDays <= 0) return 0
  const cents = Math.round(expenses * 100)
  return Math.round(cents / elapsedDays) / 100
}

/**
 * 5. Spending Volatility Safeguard check
 */
export const detectDailyVolatilitySpike = (
  transactions: Transaction[],
  dailyAverage: number,
  elapsedDays: number
): { spikeDate: string; amount: number; ratio: number } | null => {
  const expenseTxs = transactions.filter((tx) => tx.transaction_type === 'expense')

  // A. Rule: Safeguards demand a minimum of 5 active transactions and 5 elapsed days
  if (elapsedDays < 5 || expenseTxs.length < 5 || dailyAverage <= 0) {
    return null
  }

  // Sum spending per date
  const dateSpendsCents: { [date: string]: number } = {}
  expenseTxs.forEach((tx) => {
    const amtCents = Math.round(tx.amount * 100)
    dateSpendsCents[tx.transaction_date] = (dateSpendsCents[tx.transaction_date] || 0) + amtCents
  })

  let maxSpikeDate = ''
  let maxSpikeCents = 0

  for (const [date, cents] of Object.entries(dateSpendsCents)) {
    if (cents > maxSpikeCents) {
      maxSpikeCents = cents
      maxSpikeDate = date
    }
  }

  const maxSpikeAmount = maxSpikeCents / 100
  const ratio = maxSpikeAmount / dailyAverage

  // Volatility Safeguard: Must exceed 2x the daily average
  if (ratio >= 2.0) {
    return {
      spikeDate: maxSpikeDate,
      amount: maxSpikeAmount,
      ratio: Math.round(ratio * 100) / 100,
    }
  }

  return null
}

/**
 * 6. Expense Concentration metrics
 */
export const calculateExpenseConcentration = (
  breakdown: CategoryBreakdownDetail[]
): { topCategoryPercent: number; top3CategoriesPercent: number } => {
  if (breakdown.length === 0) {
    return { topCategoryPercent: 0, top3CategoriesPercent: 0 }
  }

  const topCategoryPercent = breakdown[0].percentage
  const top3Sum = breakdown.slice(0, 3).reduce((sum, item) => sum + item.percentage, 0)

  return {
    topCategoryPercent: Math.round(topCategoryPercent * 100) / 100,
    top3CategoriesPercent: Math.min(Math.round(top3Sum * 100) / 100, 100),
  }
}

/**
 * 7. Recurring Expense Attribution Ratio
 */
export const calculateRecurringExpenseRatio = (
  transactions: Transaction[],
  confirmedTransactionIds: string[]
): number => {
  const expenseTxs = transactions.filter((tx) => tx.transaction_type === 'expense')
  if (expenseTxs.length === 0) return 0

  const confirmedSet = new Set(confirmedTransactionIds)
  const totalCents = expenseTxs.reduce((sum, tx) => sum + Math.round(tx.amount * 100), 0)
  
  const recurringCents = expenseTxs
    .filter((tx) => confirmedSet.has(tx.id))
    .reduce((sum, tx) => sum + Math.round(tx.amount * 100), 0)

  if (totalCents === 0) return 0
  const pct = (recurringCents / totalCents) * 100
  return Math.round(pct * 100) / 100
}

/**
 * 8. Indian Financial Year aggregates
 */
export interface IndianFYReview {
  income: number
  expenses: number
  savings: number
  savingsRate: number
  highestSpendingMonth: string
  lowestSpendingMonth: string
  bestSavingsMonth: string
  largestCategory: string
  totalGoalContributions: number
}

export const calculateIndianFYReview = (
  transactions: Transaction[],
  categories: Category[],
  goalContributions: { amount: number; created_at: string }[],
  fyStart: string,
  fyEnd: string
): IndianFYReview => {
  const filterByDate = (dateStr: string) => dateStr >= fyStart && dateStr <= fyEnd

  const fyTxs = transactions.filter((tx) => filterByDate(tx.transaction_date))

  const income = calculatePeriodIncome(fyTxs)
  const expenses = calculatePeriodExpenses(fyTxs)
  const savings = calculatePeriodSavings(fyTxs)
  const savingsRate = calculateSavingsRate(income, expenses)

  // Monthly trends to find extremes
  const monthlyPoints = groupTrendPoints(fyTxs, fyStart, fyEnd)

  let highestSpendingMonth = 'N/A'
  let maxSpend = -1
  let lowestSpendingMonth = 'N/A'
  let minSpend = Infinity
  let bestSavingsMonth = 'N/A'
  let maxSavings = -Infinity

  monthlyPoints.forEach((pt) => {
    if (pt.expenses > maxSpend) {
      maxSpend = pt.expenses
      highestSpendingMonth = pt.label
    }
    if (pt.expenses < minSpend && pt.expenses > 0) {
      minSpend = pt.expenses
      lowestSpendingMonth = pt.label
    }
    if (pt.savings > maxSavings) {
      maxSavings = pt.savings
      bestSavingsMonth = pt.label
    }
  })

  if (minSpend === Infinity) lowestSpendingMonth = 'N/A'

  // Largest Category
  const breakdown = calculateCategoryBreakdown(categories, fyTxs, [], expenses)
  const largestCategory = breakdown.length > 0 ? breakdown[0].name : 'N/A'

  // Contributions sum
  const fyContributions = goalContributions.filter((c) => {
    const cDate = c.created_at.split('T')[0]
    return filterByDate(cDate)
  })
  const totalGoalContributions = fyContributions.reduce((sum, c) => {
    return sum + Math.round(c.amount * 100)
  }, 0) / 100

  return {
    income,
    expenses,
    savings,
    savingsRate,
    highestSpendingMonth,
    lowestSpendingMonth,
    bestSavingsMonth,
    largestCategory,
    totalGoalContributions,
  }
}
