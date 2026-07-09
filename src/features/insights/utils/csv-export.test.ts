import { describe, test, expect } from 'vitest'
import {
  escapeCSVValue,
  exportTransactionsToCSV,
  exportAccountSummaryToCSV,
  exportCategorySpendingToCSV,
  exportGoalProgressToCSV
} from './csv-export'
import type { Transaction, Account, Category, Goal, GoalContribution } from '@/features/financial/types'

describe('PFM CSV Export Engine', () => {
  test('1. String escaping of quotes, commas, and line breaks in CSV cells', () => {
    // Normal string
    expect(escapeCSVValue('Supermarket')).toBe('"Supermarket"')
    // Commas inside string
    expect(escapeCSVValue('Rent, July')).toBe('"Rent, July"')
    // Quotes inside string
    expect(escapeCSVValue('A "special" gift')).toBe('"A ""special"" gift"')
    // Newline inside string
    expect(escapeCSVValue('First line\nSecond line')).toBe('"First line\nSecond line"')
    // Numeric values
    expect(escapeCSVValue(1234.56)).toBe('"1234.56"')
    // Null/undefined values
    expect(escapeCSVValue(null)).toBe('""')
  })

  test('2. Compile Transaction CSV with standard formats and UTF-8 BOM', () => {
    const transactions: Transaction[] = [
      { id: '1', user_id: 'u', transaction_type: 'expense', amount: 450.50, account_id: 'acc-1', category_id: 'cat-1', transfer_to_account_id: null, transaction_date: '2026-07-01', payee_or_source: 'Groceries, Shop', notes: 'Weekly "food" run', created_at: '2026-07-01T10:00:00Z', updated_at: '' }
    ]
    const accounts: Account[] = [
      { id: 'acc-1', user_id: 'u', name: 'Checking Account', account_type: 'checking', currency_code: 'INR', opening_balance: 1000, is_active: true, created_at: '', updated_at: '' }
    ]
    const categories: Category[] = [
      { id: 'cat-1', user_id: null, name: 'Food Outlays', transaction_type: 'expense', icon: '', is_system: true, is_active: true, created_at: '', updated_at: '' }
    ]

    const csv = exportTransactionsToCSV(transactions, accounts, categories)

    // Verify UTF-8 BOM prefix
    expect(csv.startsWith('\uFEFF')).toBe(true)

    // Verify Headers presence
    expect(csv).toContain('"Date","Type","Account","Destination Account","Payee / Source","Category","Amount","Currency","Notes","Created At"')
    // Verify Escaping on payee & notes
    expect(csv).toContain('"Groceries, Shop"')
    expect(csv).toContain('"Weekly ""food"" run"')
    // Verify Raw decimal format without symbols
    expect(csv).toContain('"450.50"')
  })

  test('3. Compile Accounts Summary derived balances CSV', () => {
    const accounts: Account[] = [
      { id: 'acc-1', user_id: 'u', name: 'Checking', account_type: 'checking', currency_code: 'INR', opening_balance: 5000, is_active: true, created_at: '', updated_at: '' }
    ]
    const transactions: Transaction[] = [
      { id: '1', user_id: 'u', transaction_type: 'expense', amount: 1500, account_id: 'acc-1', category_id: null, transfer_to_account_id: null, transaction_date: '2026-07-01', payee_or_source: '', notes: null, created_at: '', updated_at: '' }
    ]

    const csv = exportAccountSummaryToCSV(accounts, transactions)
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('"Account Name","Account Type","Currency","Opening Balance","Current Derived Balance","Status"')
    // Derived balance = 5000 - 1500 = 3500
    expect(csv).toContain('"Checking","checking","INR","5000.00","3500.00","Active"')
  })

  test('4. Compile Category Spending aggregates CSV', () => {
    const categories: Category[] = [
      { id: 'c-food', user_id: null, name: 'Food', transaction_type: 'expense', icon: '', is_system: true, is_active: true, created_at: '', updated_at: '' }
    ]
    const transactions: Transaction[] = [
      { id: '1', user_id: 'u', transaction_type: 'expense', amount: 200, account_id: 'a', category_id: 'c-food', transfer_to_account_id: null, transaction_date: '2026-07-01', payee_or_source: '', notes: null, created_at: '', updated_at: '' }
    ]

    const csv = exportCategorySpendingToCSV(categories, transactions, [], 200)
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('"Category","Total Spent","Percentage of Expenses","Transaction Count","Average Transaction","Change vs Previous Period"')
    expect(csv).toContain('"Food","200.00","100.0%","1","200.00","New spending"')
  })

  test('5. Compile Goals Progress and Pace Status CSV', () => {
    const goals: Goal[] = [
      { id: 'g-1', user_id: 'u', name: 'Emergency Fund', target_amount: 10000, currency: 'INR', start_date: '2026-01-01', target_date: '2026-12-31', status: 'active', created_at: '', updated_at: '' }
    ]
    const contributions: { [goalId: string]: GoalContribution[] } = {
      'g-1': [
        { id: 'c-1', user_id: 'u', goal_id: 'g-1', amount: 5000, contribution_date: '2026-06-01', created_at: '', updated_at: '' }
      ]
    }

    const csv = exportGoalProgressToCSV(goals, contributions, '2026-07-09')
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('"Goal","Target Amount","Saved Amount","Remaining Amount","Progress Percentage","Target Date","Pace Status"')
    // saved: 5000, remaining: 5000, progress: 50%
    expect(csv).toContain('"Emergency Fund","10000.00","5000.00","5000.00","50.0%","2026-12-31"')
  })
})
