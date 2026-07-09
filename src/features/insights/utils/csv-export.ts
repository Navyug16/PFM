import type { Transaction, Account, Category, Goal, GoalContribution } from '@/features/financial/types'
import { calculateAccountBalance, calculateGoalSavedAmount, calculateGoalRemaining, calculateGoalProgressPercentage, calculateGoalPaceStatus } from '@/features/financial/utils/calculations'
import { calculateCategoryBreakdown } from './report-calculations'

/**
 * Escapes a cell value for safe insertion into a CSV string.
 * - Wraps in double quotes.
 * - Escapes existing double quotes by doubling them.
 * - Handles line breaks, commas, and Unicode text safely.
 */
export const escapeCSVValue = (val: string | number | null | undefined): string => {
  if (val === null || val === undefined) return '""'
  const str = String(val)
  // Double quotes escape: " -> ""
  const escaped = str.replace(/"/g, '""')
  return `"${escaped}"`
}

/**
 * Prepends the UTF-8 Byte Order Mark (BOM) to support Unicode symbols in spreadsheet tools.
 */
const withUTF8BOM = (content: string): string => {
  return `\uFEFF${content}`
}

/**
 * 1. Exports Transactions List to CSV
 */
export const exportTransactionsToCSV = (
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[]
): string => {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]))
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]))

  const headers = ['Date', 'Type', 'Account', 'Destination Account', 'Payee / Source', 'Category', 'Amount', 'Currency', 'Notes', 'Created At']
  const rows = [headers.map((h) => `"${h}"`).join(',')]

  transactions.forEach((tx) => {
    const accountName = accountMap.get(tx.account_id) || 'Unknown Account'
    const destAccountName = tx.transfer_to_account_id ? accountMap.get(tx.transfer_to_account_id) || 'Unknown Account' : ''
    const categoryName = tx.category_id ? categoryMap.get(tx.category_id) || 'Unknown Category' : ''
    // Raw numeric values format: standard floating string
    const amountStr = tx.amount.toFixed(2)

    const row = [
      escapeCSVValue(tx.transaction_date),
      escapeCSVValue(tx.transaction_type),
      escapeCSVValue(accountName),
      escapeCSVValue(destAccountName),
      escapeCSVValue(tx.payee_or_source),
      escapeCSVValue(categoryName),
      escapeCSVValue(amountStr),
      escapeCSVValue('INR'), // Default currency
      escapeCSVValue(tx.notes),
      escapeCSVValue(tx.created_at)
    ]
    rows.push(row.join(','))
  })

  return withUTF8BOM(rows.join('\n'))
}

/**
 * 2. Exports Accounts Summary to CSV
 */
export const exportAccountSummaryToCSV = (
  accounts: Account[],
  transactions: Transaction[]
): string => {
  const headers = ['Account Name', 'Account Type', 'Currency', 'Opening Balance', 'Current Derived Balance', 'Status']
  const rows = [headers.map((h) => `"${h}"`).join(',')]

  accounts.forEach((acc) => {
    const derivedBalance = calculateAccountBalance(acc, transactions)
    const row = [
      escapeCSVValue(acc.name),
      escapeCSVValue(acc.account_type),
      escapeCSVValue(acc.currency_code),
      escapeCSVValue(acc.opening_balance.toFixed(2)),
      escapeCSVValue(derivedBalance.toFixed(2)),
      escapeCSVValue(acc.is_active ? 'Active' : 'Archived')
    ]
    rows.push(row.join(','))
  })

  return withUTF8BOM(rows.join('\n'))
}

/**
 * 3. Exports Category Spending Summary to CSV
 */
export const exportCategorySpendingToCSV = (
  categories: Category[],
  transactions: Transaction[],
  prevTransactions: Transaction[],
  totalExpenses: number
): string => {
  const breakdown = calculateCategoryBreakdown(categories, transactions, prevTransactions, totalExpenses)

  const headers = ['Category', 'Total Spent', 'Percentage of Expenses', 'Transaction Count', 'Average Transaction', 'Change vs Previous Period']
  const rows = [headers.map((h) => `"${h}"`).join(',')]

  breakdown.forEach((item) => {
    const changeText = item.percentChangeAvailable
      ? `${item.direction === 'up' ? '+' : '-'}${Math.abs(item.percentageChange).toFixed(1)}%`
      : item.direction === 'up'
      ? 'New spending'
      : 'N/A'

    const row = [
      escapeCSVValue(item.name),
      escapeCSVValue(item.amount.toFixed(2)),
      escapeCSVValue(`${item.percentage.toFixed(1)}%`),
      escapeCSVValue(item.count),
      escapeCSVValue(item.average.toFixed(2)),
      escapeCSVValue(changeText)
    ]
    rows.push(row.join(','))
  })

  return withUTF8BOM(rows.join('\n'))
}

/**
 * 4. Exports Goals Progress to CSV
 */
export const exportGoalProgressToCSV = (
  goals: Goal[],
  contributions: { [goalId: string]: GoalContribution[] },
  todayString: string
): string => {
  const headers = ['Goal', 'Target Amount', 'Saved Amount', 'Remaining Amount', 'Progress Percentage', 'Target Date', 'Pace Status']
  const rows = [headers.map((h) => `"${h}"`).join(',')]

  goals.forEach((g) => {
    const goalContribs = contributions[g.id] || []
    const saved = calculateGoalSavedAmount(goalContribs)
    const remaining = calculateGoalRemaining(g.target_amount, saved)
    const progress = calculateGoalProgressPercentage(g.target_amount, saved)
    
    // Pace calculations
    const paceStatus = calculateGoalPaceStatus({
      startDate: g.start_date,
      targetDate: g.target_date,
      targetAmount: g.target_amount,
      savedAmount: saved,
      today: todayString
    })

    const row = [
      escapeCSVValue(g.name),
      escapeCSVValue(g.target_amount.toFixed(2)),
      escapeCSVValue(saved.toFixed(2)),
      escapeCSVValue(remaining.toFixed(2)),
      escapeCSVValue(`${progress.toFixed(1)}%`),
      escapeCSVValue(g.target_date),
      escapeCSVValue(paceStatus)
    ]
    rows.push(row.join(','))
  })

  return withUTF8BOM(rows.join('\n'))
}
