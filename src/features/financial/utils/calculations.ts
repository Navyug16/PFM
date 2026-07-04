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
