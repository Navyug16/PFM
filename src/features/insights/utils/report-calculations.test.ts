import { describe, test, expect } from 'vitest'
import {
  calculateCategoryBreakdown,
  calculateMerchantRankings,
  groupTrendPoints,
  detectDailyVolatilitySpike,
  calculateExpenseConcentration,
  calculateRecurringExpenseRatio,
  calculateIndianFYReview
} from './report-calculations'
import type { Transaction, Category } from '@/features/financial/types'

describe('PFM Report Calculations Engine', () => {
  const dummyCategories: Category[] = [
    { id: 'cat-1', user_id: null, name: 'Food', transaction_type: 'expense', icon: 'food', is_system: true, is_active: true, created_at: '', updated_at: '' },
    { id: 'cat-2', user_id: null, name: 'Rent', transaction_type: 'expense', icon: 'rent', is_system: true, is_active: true, created_at: '', updated_at: '' },
    { id: 'cat-3', user_id: null, name: 'Salary', transaction_type: 'income', icon: 'salary', is_system: true, is_active: true, created_at: '', updated_at: '' }
  ]

  test('1. Category Outlays percentages, counts, averages, and zero baseline fallback', () => {
    const transactions: Transaction[] = [
      { id: 'tx-1', user_id: 'u-1', transaction_type: 'expense', amount: 1500, account_id: 'acc-1', category_id: 'cat-1', transfer_to_account_id: null, transaction_date: '2026-07-01', payee_or_source: 'Supermarket', notes: '', created_at: '', updated_at: '' },
      { id: 'tx-2', user_id: 'u-1', transaction_type: 'expense', amount: 3500, account_id: 'acc-1', category_id: 'cat-1', transfer_to_account_id: null, transaction_date: '2026-07-02', payee_or_source: 'Groceries', notes: '', created_at: '', updated_at: '' }
    ]

    const prevCategoryAmounts = { 'cat-1': 2000 } // previous spending: 2000
    const totalExpenses = 5000

    const result = calculateCategoryBreakdown(dummyCategories, transactions, [], totalExpenses, prevCategoryAmounts)

    expect(result.length).toBe(1)
    expect(result[0].id).toBe('cat-1')
    expect(result[0].amount).toBe(5000)
    expect(result[0].percentage).toBe(100)
    expect(result[0].count).toBe(2)
    expect(result[0].average).toBe(2500)
    // 5000 vs 2000 => diff: 3000 (+150%)
    expect(result[0].absoluteChange).toBe(3000)
    expect(result[0].percentageChange).toBe(150)
    expect(result[0].percentChangeAvailable).toBe(true)
    expect(result[0].direction).toBe('up')

    // Zero baseline fallback test
    const zeroBaselineResult = calculateCategoryBreakdown(dummyCategories, transactions, [], totalExpenses, { 'cat-1': 0 })
    expect(zeroBaselineResult[0].percentChangeAvailable).toBe(false)
    expect(zeroBaselineResult[0].direction).toBe('up')
  })

  test('2. Top 5 / Top 10 merchant/payee rankings sorting', () => {
    const transactions: Transaction[] = [
      { id: 't1', user_id: 'u-1', transaction_type: 'expense', amount: 100, account_id: 'a', category_id: 'c', transfer_to_account_id: null, transaction_date: '2026-07-01', payee_or_source: 'Merchant A', notes: null, created_at: '', updated_at: '' },
      { id: 't2', user_id: 'u-1', transaction_type: 'expense', amount: 300, account_id: 'a', category_id: 'c', transfer_to_account_id: null, transaction_date: '2026-07-02', payee_or_source: 'Merchant B', notes: null, created_at: '', updated_at: '' },
      { id: 't3', user_id: 'u-1', transaction_type: 'expense', amount: 200, account_id: 'a', category_id: 'c', transfer_to_account_id: null, transaction_date: '2026-07-03', payee_or_source: 'Merchant A', notes: null, created_at: '', updated_at: '' }
    ]

    const ranks = calculateMerchantRankings(transactions, 600, 5)
    expect(ranks.length).toBe(2)
    // Merchant A total = 300, Merchant B total = 300. Merchant A ranks first due to count/sort order
    expect(ranks[0].name).toBe('Merchant A')
    expect(ranks[0].amount).toBe(300)
    expect(ranks[0].count).toBe(2)
    expect(ranks[0].percentage).toBe(50)
  })

  test('3. Daily, Weekly, and Monthly Trend Grouping bounds transitions', () => {
    const transactions: Transaction[] = [
      { id: '1', user_id: 'u', transaction_type: 'income', amount: 1000, account_id: 'a', category_id: 'c', transfer_to_account_id: null, transaction_date: '2026-07-01', payee_or_source: '', notes: null, created_at: '', updated_at: '' },
      { id: '2', user_id: 'u', transaction_type: 'expense', amount: 400, account_id: 'a', category_id: 'c', transfer_to_account_id: null, transaction_date: '2026-07-05', payee_or_source: '', notes: null, created_at: '', updated_at: '' }
    ]

    // A. Daily (diff <= 14 days)
    const daily = groupTrendPoints(transactions, '2026-07-01', '2026-07-05')
    expect(daily.length).toBe(5)
    expect(daily[0].income).toBe(1000)
    expect(daily[4].expenses).toBe(400)

    // B. Weekly (14 < diff <= 60 days)
    const weekly = groupTrendPoints(transactions, '2026-07-01', '2026-07-15')
    expect(weekly.length).toBe(3) // 15 days range / 7 = 3 blocks

    // C. Monthly (diff > 60 days)
    const monthly = groupTrendPoints(transactions, '2025-11-01', '2026-02-01')
    expect(monthly.length).toBe(4) // Nov, Dec, Jan, Feb
    expect(monthly[0].label).toBe('Nov 25')
    expect(monthly[2].label).toBe('Jan 26')
  })

  test('4. Volatility spike detection minimum safeguards', () => {
    const transactions: Transaction[] = [
      { id: '1', user_id: 'u-1', transaction_type: 'expense', amount: 5000, account_id: 'a', category_id: 'c', transfer_to_account_id: null, transaction_date: '2026-07-01', payee_or_source: '', notes: null, created_at: '', updated_at: '' }
    ]

    // Minimum data check: only 1 transaction, should return null (safeguard triggers)
    const spikeFail = detectDailyVolatilitySpike(transactions, 1000, 10)
    expect(spikeFail).toBeNull()

    // Create 5 transactions on different dates to pass safeguard
    const safeTxs: Transaction[] = [
      { id: '1', user_id: 'u', transaction_type: 'expense', amount: 100, account_id: 'a', category_id: 'c', transfer_to_account_id: null, transaction_date: '2026-07-01', payee_or_source: '', notes: null, created_at: '', updated_at: '' },
      { id: '2', user_id: 'u', transaction_type: 'expense', amount: 100, account_id: 'a', category_id: 'c', transfer_to_account_id: null, transaction_date: '2026-07-02', payee_or_source: '', notes: null, created_at: '', updated_at: '' },
      { id: '3', user_id: 'u', transaction_type: 'expense', amount: 100, account_id: 'a', category_id: 'c', transfer_to_account_id: null, transaction_date: '2026-07-03', payee_or_source: '', notes: null, created_at: '', updated_at: '' },
      { id: '4', user_id: 'u', transaction_type: 'expense', amount: 100, account_id: 'a', category_id: 'c', transfer_to_account_id: null, transaction_date: '2026-07-04', payee_or_source: '', notes: null, created_at: '', updated_at: '' },
      { id: '5', user_id: 'u', transaction_type: 'expense', amount: 2000, account_id: 'a', category_id: 'c', transfer_to_account_id: null, transaction_date: '2026-07-05', payee_or_source: '', notes: null, created_at: '', updated_at: '' }
    ]
    // Total expense = 2400. Daily avg = 2400 / 10 days = 240. Spike is 2000 (which is 8.3x average)
    const spikeSuccess = detectDailyVolatilitySpike(safeTxs, 240, 10)
    expect(spikeSuccess).not.toBeNull()
    expect(spikeSuccess!.spikeDate).toBe('2026-07-05')
    expect(spikeSuccess!.ratio).toBe(8.33)
  })

  test('5. Expense Concentration and Recurring Expense Ratio logic', () => {
    const breakdown = [
      { id: '1', name: 'Food', icon: '', amount: 600, percentage: 60, count: 1, average: 600, absoluteChange: 0, percentageChange: 0, percentChangeAvailable: false, direction: 'unchanged' as const },
      { id: '2', name: 'Rent', icon: '', amount: 300, percentage: 30, count: 1, average: 300, absoluteChange: 0, percentageChange: 0, percentChangeAvailable: false, direction: 'unchanged' as const },
      { id: '3', name: 'Misc', icon: '', amount: 100, percentage: 10, count: 1, average: 100, absoluteChange: 0, percentageChange: 0, percentChangeAvailable: false, direction: 'unchanged' as const }
    ]

    const concentration = calculateExpenseConcentration(breakdown)
    expect(concentration.topCategoryPercent).toBe(60)
    expect(concentration.top3CategoriesPercent).toBe(100)

    // Recurring ratio using confirmed transaction_id
    const transactions: Transaction[] = [
      { id: 't-exp-1', user_id: 'u', transaction_type: 'expense', amount: 500, account_id: 'a', category_id: 'c', transfer_to_account_id: null, transaction_date: '2026-07-01', payee_or_source: '', notes: null, created_at: '', updated_at: '' },
      { id: 't-exp-2', user_id: 'u', transaction_type: 'expense', amount: 1500, account_id: 'a', category_id: 'c', transfer_to_account_id: null, transaction_date: '2026-07-02', payee_or_source: '', notes: null, created_at: '', updated_at: '' }
    ]
    const ratio = calculateRecurringExpenseRatio(transactions, ['t-exp-2'])
    expect(ratio).toBe(75) // 1500 / 2000 = 75%
  })

  test('6. Indian Financial Year aggregates & goal contributions sums', () => {
    const transactions: Transaction[] = [
      { id: '1', user_id: 'u', transaction_type: 'income', amount: 20000, account_id: 'a', category_id: 'c', transfer_to_account_id: null, transaction_date: '2026-05-10', payee_or_source: '', notes: null, created_at: '', updated_at: '' },
      { id: '2', user_id: 'u', transaction_type: 'expense', amount: 5000, account_id: 'a', category_id: 'c', transfer_to_account_id: 'cat-1', transaction_date: '2026-06-15', payee_or_source: '', notes: null, created_at: '', updated_at: '' }
    ]
    const contributions = [
      { amount: 3000, created_at: '2026-07-20T10:00:00Z' }
    ]

    const fyReport = calculateIndianFYReview(transactions, dummyCategories, contributions, '2026-04-01', '2027-03-31')
    expect(fyReport.income).toBe(20000)
    expect(fyReport.expenses).toBe(5000)
    expect(fyReport.savings).toBe(15000)
    expect(fyReport.savingsRate).toBe(75)
    expect(fyReport.totalGoalContributions).toBe(3000)
  })

  test('7. Transfer Neutrality and zero/negative math resilience', () => {
    const transactions: Transaction[] = [
      { id: '1', user_id: 'u', transaction_type: 'transfer', amount: 99000, account_id: 'acc-checking', category_id: null, transfer_to_account_id: 'acc-savings', transaction_date: '2026-07-01', payee_or_source: '', notes: null, created_at: '', updated_at: '' }
    ]
    
    // Group trend points with only transfer: income and expense must remain neutral (0)
    const points = groupTrendPoints(transactions, '2026-07-01', '2026-07-02')
    expect(points[0].income).toBe(0)
    expect(points[0].expenses).toBe(0)
    expect(points[0].savings).toBe(0)
    expect(points[0].savingsRate).toBe(0)
  })
})
