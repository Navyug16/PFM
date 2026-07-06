// Core Financial Calculation Engine for PFM Ledger
import type { Account, Transaction, GoalContribution, Category } from '../types'
import { getRemainingMonths, getRemainingWeeks } from './date-utils'

// Helper to sum an array of numbers using integer cents to prevent IEEE-754 float drift
const sumCents = (values: number[]): number => {
  const totalCents = values.reduce((sum, val) => {
    return sum + Math.round(val * 100)
  }, 0)
  return totalCents / 100
}

// 1. Calculates a single account's balance dynamically based on transaction history
export const calculateAccountBalance = (
  account: Account,
  transactions: Transaction[]
): number => {
  let balanceCents = Math.round(account.opening_balance * 100)

  // Filter transactions related to this account
  const accountTx = transactions.filter(
    (tx) => tx.account_id === account.id || tx.transfer_to_account_id === account.id
  )

  for (const tx of accountTx) {
    const amtCents = Math.round(tx.amount * 100)

    if (tx.transaction_type === 'income' && tx.account_id === account.id) {
      balanceCents += amtCents
    } else if (tx.transaction_type === 'expense' && tx.account_id === account.id) {
      balanceCents -= amtCents
    } else if (tx.transaction_type === 'transfer') {
      if (tx.account_id === account.id) {
        // Outgoing transfer reduces balance
        balanceCents -= amtCents
      }
      if (tx.transfer_to_account_id === account.id) {
        // Incoming transfer increases balance
        balanceCents += amtCents
      }
    }
  }

  return balanceCents / 100
}

// 2. Calculates the balances of all active accounts grouped by currency
export const calculateTotalAccountBalance = (
  accounts: Account[],
  transactions: Transaction[]
): { [currency: string]: number } => {
  const activeAccounts = accounts.filter((acc) => acc.is_active)
  const currencyBalancesCents: { [currency: string]: number } = {}

  for (const acc of activeAccounts) {
    const balance = calculateAccountBalance(acc, transactions)
    const currency = acc.currency_code.toUpperCase()
    
    const balanceCents = Math.round(balance * 100)
    currencyBalancesCents[currency] = (currencyBalancesCents[currency] || 0) + balanceCents
  }

  // Convert back from cents to decimal currency units
  const result: { [currency: string]: number } = {}
  for (const [curr, amtCents] of Object.entries(currencyBalancesCents)) {
    result[curr] = amtCents / 100
  }

  return result
}

// 3. Secures Net Financial Position: rejects summing different currencies together
export const getSingleCurrencyNetPosition = (
  accounts: Account[],
  transactions: Transaction[]
): number => {
  const balances = calculateTotalAccountBalance(accounts, transactions)
  const currencies = Object.keys(balances)

  if (currencies.length === 0) return 0
  if (currencies.length > 1) {
    throw new Error(
      `Incompatible currencies detected: Cannot sum ${currencies.join(', ')} directly. Please convert first.`
    )
  }

  return balances[currencies[0]]
}

// 4. Sums all INCOME transactions in date range (excluding transfers)
export const calculatePeriodIncome = (
  transactions: Transaction[],
  startDate?: string,
  endDate?: string
): number => {
  const filtered = transactions.filter((tx) => {
    if (tx.transaction_type !== 'income') return false
    if (startDate && tx.transaction_date < startDate) return false
    if (endDate && tx.transaction_date > endDate) return false
    return true
  })

  return sumCents(filtered.map((tx) => tx.amount))
}

// 5. Sums all EXPENSE transactions in date range (excluding transfers)
export const calculatePeriodExpenses = (
  transactions: Transaction[],
  startDate?: string,
  endDate?: string
): number => {
  const filtered = transactions.filter((tx) => {
    if (tx.transaction_type !== 'expense') return false
    if (startDate && tx.transaction_date < startDate) return false
    if (endDate && tx.transaction_date > endDate) return false
    return true
  })

  return sumCents(filtered.map((tx) => tx.amount))
}

// 6. Period Savings = Income - Expenses
export const calculatePeriodSavings = (
  transactions: Transaction[],
  startDate?: string,
  endDate?: string
): number => {
  const income = calculatePeriodIncome(transactions, startDate, endDate)
  const expenses = calculatePeriodExpenses(transactions, startDate, endDate)

  const incomeCents = Math.round(income * 100)
  const expensesCents = Math.round(expenses * 100)

  return (incomeCents - expensesCents) / 100
}

// 7. Savings Rate = (Savings / Income) * 100
// Zero-Income Behavior: Returns 0.00% if income is 0 to prevent division-by-zero
export const calculateSavingsRate = (income: number, expenses: number): number => {
  if (income <= 0) return 0
  const savings = income - expenses
  const rate = (savings / income) * 100
  return Math.round(rate * 100) / 100
}

// 8. Calculates expense spending grouped by category
export const calculateCategorySpending = (
  transactions: Transaction[],
  startDate?: string,
  endDate?: string
): { [categoryId: string]: number } => {
  const categoryCents: { [catId: string]: number } = {}

  const filteredExpenses = transactions.filter((tx) => {
    if (tx.transaction_type !== 'expense') return false
    if (!tx.category_id) return false
    if (startDate && tx.transaction_date < startDate) return false
    if (endDate && tx.transaction_date > endDate) return false
    return true
  })

  for (const tx of filteredExpenses) {
    const catId = tx.category_id!
    const amtCents = Math.round(tx.amount * 100)
    categoryCents[catId] = (categoryCents[catId] || 0) + amtCents
  }

  const result: { [catId: string]: number } = {}
  for (const [catId, amtCents] of Object.entries(categoryCents)) {
    result[catId] = amtCents / 100
  }

  return result
}

// 9. Calculates sum of goal contributions
export const calculateGoalSavedAmount = (contributions: GoalContribution[]): number => {
  return sumCents(contributions.map((c) => c.amount))
}

// 10. Calculates remaining goal target
export const calculateGoalRemaining = (target: number, saved: number): number => {
  const targetCents = Math.round(target * 100)
  const savedCents = Math.round(saved * 100)
  const remainingCents = Math.max(targetCents - savedCents, 0)
  return remainingCents / 100
}

// 11. Calculates goal progress percentage (supports exceeding 100%)
// Zero-Target Behavior: Returns 0.00% if target is 0
export const calculateGoalProgressPercentage = (target: number, saved: number): number => {
  if (target <= 0) return 0
  const pct = (saved / target) * 100
  return Math.round(pct * 100) / 100
}

// 12. Calculates monthly savings required to reach a goal by its target date
export const calculateRequiredMonthlySavings = (
  remainingAmount: number,
  targetDate: string,
  referenceDate: string
): number => {
  if (remainingAmount <= 0) return 0
  const monthsLeft = getRemainingMonths(referenceDate, targetDate)
  const reqAmt = remainingAmount / monthsLeft
  return Math.round(reqAmt * 100) / 100
}

// 13. Calculates weekly savings required to reach a goal by its target date
export const calculateRequiredWeeklySavings = (
  remainingAmount: number,
  targetDate: string,
  referenceDate: string
): number => {
  if (remainingAmount <= 0) return 0
  const weeksLeft = getRemainingWeeks(referenceDate, targetDate)
  const reqAmt = remainingAmount / weeksLeft
  return Math.round(reqAmt * 100) / 100
}

// 14. Compares expenses between two distinct periods
export const comparePeriodSpending = (
  transactions: Transaction[],
  currentStart: string,
  currentEnd: string,
  previousStart: string,
  previousEnd: string
): { current: number; previous: number; percentChange: number } => {
  const current = calculatePeriodExpenses(transactions, currentStart, currentEnd)
  const previous = calculatePeriodExpenses(transactions, previousStart, previousEnd)

  if (previous <= 0) {
    return {
      current,
      previous,
      percentChange: current > 0 ? 100 : 0,
    }
  }

  const change = ((current - previous) / previous) * 100
  return {
    current,
    previous,
    percentChange: Math.round(change * 100) / 100,
  }
}

// 15. Identifies the largest expense category in a given range
export const identifyLargestExpenseCategory = (
  transactions: Transaction[],
  categories: Category[],
  startDate?: string,
  endDate?: string
): { category: Category | null; amount: number } => {
  const spending = calculateCategorySpending(transactions, startDate, endDate)
  
  let maxCatId: string | null = null
  let maxAmt = 0

  for (const [catId, amount] of Object.entries(spending)) {
    if (amount > maxAmt) {
      maxAmt = amount
      maxCatId = catId
    }
  }

  if (!maxCatId) {
    return { category: null, amount: 0 }
  }

  const category = categories.find((c) => c.id === maxCatId) || null
  return { category, amount: maxAmt }
}

// 16. Available Balance: sum of current balances for checking, savings, and cash accounts
export const calculateAvailableBalance = (
  accounts: Account[],
  transactions: Transaction[]
): number => {
  const liquidAccounts = accounts.filter(
    (acc) =>
      acc.is_active &&
      (acc.account_type === 'checking' ||
        acc.account_type === 'savings' ||
        acc.account_type === 'cash')
  )
  let totalCents = 0
  for (const acc of liquidAccounts) {
    const balance = calculateAccountBalance(acc, transactions)
    totalCents += Math.round(balance * 100)
  }
  return totalCents / 100
}

// 17. Today's Spending: sum of expense transactions logged on specified date
export const calculateTodaySpending = (
  transactions: Transaction[],
  todayDateString: string
): number => {
  const todayTxs = transactions.filter(
    (tx) => tx.transaction_type === 'expense' && tx.transaction_date === todayDateString
  )
  const cents = todayTxs.reduce((sum, tx) => sum + Math.round(tx.amount * 100), 0)
  return cents / 100
}

// 18. Average Daily Spending: sum of expenses divided by number of elapsed days in period
export const calculateAverageDailySpending = (
  transactions: Transaction[],
  startDate: string,
  endDate: string,
  todayString: string
): number => {
  const periodExpenses = calculatePeriodExpenses(transactions, startDate, endDate)
  const dStart = new Date(startDate)
  const dEnd = new Date(endDate)
  const dToday = new Date(todayString)

  const effectiveEnd = dToday >= dStart && dToday <= dEnd ? dToday : dEnd

  const oneDay = 24 * 60 * 60 * 1000
  const elapsedDays = Math.max(
    Math.ceil((effectiveEnd.getTime() - dStart.getTime()) / oneDay) + 1,
    1
  )

  const expCents = Math.round(periodExpenses * 100)
  const avgCents = Math.round(expCents / elapsedDays)
  return avgCents / 100
}

// 19. Goal Pace Status: calculates elapsed time progress versus actual progress with 2% tolerance
export const calculateGoalPaceStatus = (
  goal: { start_date: string; target_date: string; target_amount: number },
  savedAmount: number,
  todayString: string
): 'ahead' | 'on_track' | 'behind' | 'unavailable' => {
  const dStart = new Date(goal.start_date)
  const dEnd = new Date(goal.target_date)
  const dToday = new Date(todayString)

  const totalDuration = dEnd.getTime() - dStart.getTime()
  if (totalDuration <= 0) return 'unavailable'

  const elapsed = Math.min(Math.max(dToday.getTime() - dStart.getTime(), 0), totalDuration)
  const expectedProgress = (elapsed / totalDuration) * goal.target_amount
  const actualProgress = savedAmount
  const progressDifference = actualProgress - expectedProgress
  const tolerance = goal.target_amount * 0.02 // 2% tolerance boundary

  if (actualProgress >= goal.target_amount || progressDifference >= tolerance) {
    return 'ahead'
  }
  if (progressDifference <= -tolerance) {
    return 'behind'
  }
  return 'on_track'
}

// 20. Category Share: relative percentage of total period expenses
export const calculateCategoryShare = (amount: number, totalPeriodExpenses: number): number => {
  if (totalPeriodExpenses <= 0) return 0
  const share = (amount / totalPeriodExpenses) * 100
  return Math.round(share * 100) / 100
}

// 21. Structured Period Comparison Result
export interface PeriodComparisonResult {
  currentAmount: number
  previousAmount: number
  absoluteChange: number
  percentageChange: number // Absolute value of percentage change
  direction: 'up' | 'down' | 'unchanged' | 'unavailable'
  comparisonAvailable: boolean
  percentChangeAvailable: boolean
}

export const calculatePeriodComparison = (
  currentAmount: number,
  previousAmount: number,
  hasPreviousData: boolean = true
): PeriodComparisonResult => {
  if (!hasPreviousData) {
    return {
      currentAmount,
      previousAmount: 0,
      absoluteChange: 0,
      percentageChange: 0,
      direction: 'unavailable',
      comparisonAvailable: false,
      percentChangeAvailable: false,
    }
  }

  const currentCents = Math.round(currentAmount * 100)
  const previousCents = Math.round(previousAmount * 100)
  const absoluteCents = currentCents - previousCents
  const absoluteChange = absoluteCents / 100

  if (previousCents === 0) {
    return {
      currentAmount,
      previousAmount: 0,
      absoluteChange,
      percentageChange: 0, // Zero growth percentage from zero baseline
      direction: currentCents > 0 ? 'up' : (currentCents < 0 ? 'down' : 'unchanged'),
      comparisonAvailable: true,
      percentChangeAvailable: false,
    }
  }

  const percentageChange = Math.round((absoluteCents / previousCents) * 10000) / 100
  let direction: 'up' | 'down' | 'unchanged' = 'unchanged'
  if (absoluteCents > 0) direction = 'up'
  else if (absoluteCents < 0) direction = 'down'

  return {
    currentAmount,
    previousAmount,
    absoluteChange,
    percentageChange: Math.abs(percentageChange),
    direction,
    comparisonAvailable: true,
    percentChangeAvailable: true,
  }
}

// 22. Group Cash Flow by Interval: Groups income and expenses into intervals based on periodType
export interface CashFlowInterval {
  label: string
  income: number
  expenses: number
}

export const groupCashFlowByInterval = (
  transactions: Transaction[],
  periodType: 'week' | 'month' | 'last_month' | 'financial_year',
  startDate: string,
  _endDate: string
): CashFlowInterval[] => {
  const dStart = new Date(startDate)

  if (periodType === 'week') {
    // 7 separate days
    const intervals: CashFlowInterval[] = []
    const temp = new Date(dStart)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    for (let i = 0; i < 7; i++) {
      const dateStr = temp.toISOString().split('T')[0]
      const label = dayNames[temp.getDay()]

      const txs = transactions.filter((t) => t.transaction_date === dateStr)
      const income = txs
        .filter((t) => t.transaction_type === 'income')
        .reduce((sum, t) => sum + Math.round(t.amount * 100), 0)
      const expenses = txs
        .filter((t) => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + Math.round(t.amount * 100), 0)

      intervals.push({
        label,
        income: income / 100,
        expenses: expenses / 100,
      })
      temp.setDate(temp.getDate() + 1)
    }
    return intervals
  } else if (periodType === 'month' || periodType === 'last_month') {
    // 5 weekly intervals
    const intervals: CashFlowInterval[] = []
    const dayRanges = [
      { label: 'W1 (1-7)', startDay: 1, endDay: 7 },
      { label: 'W2 (8-14)', startDay: 8, endDay: 14 },
      { label: 'W3 (15-21)', startDay: 15, endDay: 21 },
      { label: 'W4 (22-28)', startDay: 22, endDay: 28 },
      { label: 'W5 (29+)', startDay: 29, endDay: 31 },
    ]

    for (const range of dayRanges) {
      const txs = transactions.filter((t) => {
        const txDate = new Date(t.transaction_date)
        if (txDate.getFullYear() !== dStart.getFullYear() || txDate.getMonth() !== dStart.getMonth()) {
          return false
        }
        const day = txDate.getDate()
        return day >= range.startDay && day <= range.endDay
      })

      const income = txs
        .filter((t) => t.transaction_type === 'income')
        .reduce((sum, t) => sum + Math.round(t.amount * 100), 0)
      const expenses = txs
        .filter((t) => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + Math.round(t.amount * 100), 0)

      intervals.push({
        label: range.label,
        income: income / 100,
        expenses: expenses / 100,
      })
    }
    return intervals
  } else {
    // financial_year: group by month (April to March)
    const intervals: CashFlowInterval[] = []
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]

    // Determine the sequence of months from dStart to dEnd
    const temp = new Date(dStart)
    // Avoid timezone offsets by setting day to 15
    temp.setDate(15)

    for (let i = 0; i < 12; i++) {
      const m = temp.getMonth()
      const y = temp.getFullYear()
      const label = `${monthNames[m]} ${String(y).slice(-2)}`

      const txs = transactions.filter((t) => {
        const txDate = new Date(t.transaction_date)
        return txDate.getFullYear() === y && txDate.getMonth() === m
      })

      const income = txs
        .filter((t) => t.transaction_type === 'income')
        .reduce((sum, t) => sum + Math.round(t.amount * 100), 0)
      const expenses = txs
        .filter((t) => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + Math.round(t.amount * 100), 0)

      intervals.push({
        label,
        income: income / 100,
        expenses: expenses / 100,
      })

      temp.setMonth(temp.getMonth() + 1)
    }
    return intervals
  }
}

// 22. Goal Elapsed Percentage (Clamped between 0 and 100)
export const calculateGoalElapsedPercentage = (
  startDate: string,
  targetDate: string,
  today: string
): number => {
  const dStart = new Date(startDate)
  const dEnd = new Date(targetDate)
  const dToday = new Date(today)

  const total = dEnd.getTime() - dStart.getTime()
  if (total <= 0) return 0

  const elapsed = dToday.getTime() - dStart.getTime()
  const pct = (elapsed / total) * 100
  return Math.min(Math.max(Math.round(pct * 100) / 100, 0), 100)
}

// 23. Goal Expected Progress
export const calculateGoalExpectedProgress = (
  startDate: string,
  targetDate: string,
  today: string,
  targetAmount: number
): number => {
  const elapsedPct = calculateGoalElapsedPercentage(startDate, targetDate, today)
  const expected = (elapsedPct / 100) * targetAmount
  return Math.round(expected * 100) / 100
}

// 24. Goal Contribution Rate (Saved per day elapsed, including today)
export const calculateGoalContributionRate = (
  savedAmount: number,
  startDate: string,
  today: string
): number => {
  const dStart = new Date(startDate)
  const dToday = new Date(today)
  const oneDay = 24 * 60 * 60 * 1000

  if (dToday < dStart) return 0
  const elapsedDays = Math.round((dToday.getTime() - dStart.getTime()) / oneDay) + 1
  return savedAmount / Math.max(elapsedDays, 1)
}

// 25. Goal Projected Completion Date (Returns YYYY-MM-DD or null if never)
export const calculateGoalProjectedCompletionDate = (
  startDate: string,
  savedAmount: number,
  targetAmount: number,
  today: string,
  targetDate: string
): string | null => {
  if (savedAmount >= targetAmount) {
    return targetDate
  }

  const rate = calculateGoalContributionRate(savedAmount, startDate, today)
  if (rate <= 0) return null

  const remainingAmount = targetAmount - savedAmount
  const remainingDays = Math.ceil(remainingAmount / rate)

  const compDate = new Date(today)
  compDate.setDate(compDate.getDate() + remainingDays)

  const y = compDate.getFullYear()
  const m = String(compDate.getMonth() + 1).padStart(2, '0')
  const d = String(compDate.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 26. Goal Recovery Amount Required (Monthly amount required from reference date to recover from behind pace)
export const calculateGoalRecoveryAmount = (
  remainingAmount: number,
  targetDate: string,
  today: string
): number => {
  return calculateRequiredMonthlySavings(remainingAmount, targetDate, today)
}


