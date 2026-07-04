import { describe, it, expect } from 'vitest'
import type { Account, Transaction, Category } from '../types'
import {
  calculateAccountBalance,
  calculateTotalAccountBalance,
  getSingleCurrencyNetPosition,
  calculatePeriodIncome,
  calculatePeriodExpenses,
  calculatePeriodSavings,
  calculateSavingsRate,
  calculateCategorySpending,
  calculateGoalSavedAmount,
  calculateGoalRemaining,
  calculateGoalProgressPercentage,
  calculateRequiredMonthlySavings,
  calculateRequiredWeeklySavings,
  comparePeriodSpending,
  identifyLargestExpenseCategory
} from './calculations'
import { getIndianFinancialYear, getRemainingMonths, getRemainingWeeks } from './date-utils'

// Mock Data Builders
const createMockAccount = (overrides: Partial<Account> = {}): Account => ({
  id: 'acc-1',
  user_id: 'user-1',
  name: 'Checking',
  account_type: 'checking',
  currency_code: 'INR',
  opening_balance: 0,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

const createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  user_id: 'user-1',
  transaction_type: 'income',
  amount: 0,
  account_id: 'acc-1',
  category_id: null,
  transfer_to_account_id: null,
  transaction_date: '2026-07-04',
  payee_or_source: null,
  notes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

describe('Financial Calculations Engine', () => {

  describe('1. calculateAccountBalance', () => {
    it('should match the opening balance with no transactions', () => {
      const account = createMockAccount({ opening_balance: 1000 })
      const balance = calculateAccountBalance(account, [])
      expect(balance).toBe(1000)
    })

    it('should add income and subtract expenses correctly', () => {
      const account = createMockAccount({ id: 'acc-1', opening_balance: 5000 })
      const transactions = [
        createMockTransaction({ transaction_type: 'income', amount: 1500, account_id: 'acc-1' }),
        createMockTransaction({ transaction_type: 'expense', amount: 800, account_id: 'acc-1' }),
        createMockTransaction({ transaction_type: 'income', amount: 200, account_id: 'acc-2' }), // Ignored (other account)
      ]
      const balance = calculateAccountBalance(account, transactions)
      expect(balance).toBe(5700) // 5000 + 1500 - 800
    })

    it('should handle outgoing and incoming transfers properly', () => {
      const account = createMockAccount({ id: 'acc-1', opening_balance: 2000 })
      const transactions = [
        createMockTransaction({
          transaction_type: 'transfer',
          amount: 500,
          account_id: 'acc-1',
          transfer_to_account_id: 'acc-2'
        }), // Outgoing
        createMockTransaction({
          transaction_type: 'transfer',
          amount: 300,
          account_id: 'acc-3',
          transfer_to_account_id: 'acc-1'
        }), // Incoming
      ]
      const balance = calculateAccountBalance(account, transactions)
      expect(balance).toBe(1800) // 2000 - 500 + 300
    })
  })

  describe('2. calculateTotalAccountBalance & Liabilities', () => {
    it('should sum active asset accounts', () => {
      const accounts = [
        createMockAccount({ id: 'acc-1', opening_balance: 1000 }),
        createMockAccount({ id: 'acc-2', opening_balance: 3000 }),
        createMockAccount({ id: 'acc-3', opening_balance: 5000, is_active: false }) // Ignored
      ]
      const totals = calculateTotalAccountBalance(accounts, [])
      expect(totals).toEqual({ INR: 4000 })
    })

    it('should subtract liabilities correctly using negative sign conventions', () => {
      const accounts = [
        createMockAccount({ id: 'acc-checking', opening_balance: 10000, account_type: 'checking' }),
        createMockAccount({ id: 'acc-cc', opening_balance: -3000, account_type: 'credit_card' }), // Debt
        createMockAccount({ id: 'acc-loan', opening_balance: -2000, account_type: 'loan' }), // Debt
      ]
      const totals = calculateTotalAccountBalance(accounts, [])
      expect(totals).toEqual({ INR: 5000 }) // 10000 + (-3000) + (-2000)
    })

    it('should calculate Net Position for a single currency', () => {
      const accounts = [
        createMockAccount({ id: 'acc-1', opening_balance: 10000 }),
        createMockAccount({ id: 'acc-2', opening_balance: -2000, account_type: 'credit_card' })
      ]
      const net = getSingleCurrencyNetPosition(accounts, [])
      expect(net).toBe(8000)
    })
  })

  describe('3. Multi-Currency Safety', () => {
    it('should group totals by currency when multiple codes exist', () => {
      const accounts = [
        createMockAccount({ id: 'acc-1', opening_balance: 5000, currency_code: 'INR' }),
        createMockAccount({ id: 'acc-2', opening_balance: 200, currency_code: 'USD' })
      ]
      const totals = calculateTotalAccountBalance(accounts, [])
      expect(totals).toEqual({ INR: 5000, USD: 200 })
    })

    it('should throw an error and reject single net position calculation when multiple currencies are mixed', () => {
      const accounts = [
        createMockAccount({ id: 'acc-1', opening_balance: 5000, currency_code: 'INR' }),
        createMockAccount({ id: 'acc-2', opening_balance: 200, currency_code: 'USD' })
      ]
      expect(() => getSingleCurrencyNetPosition(accounts, [])).toThrowError(
        'Incompatible currencies detected'
      )
    })
  })

  describe('4. Period Metrics & Transfer Neutrality', () => {
    const transactions = [
      createMockTransaction({ transaction_type: 'income', amount: 5000, transaction_date: '2026-07-01' }),
      createMockTransaction({ transaction_type: 'expense', amount: 1200, transaction_date: '2026-07-02' }),
      createMockTransaction({
        transaction_type: 'transfer',
        amount: 800,
        account_id: 'acc-1',
        transfer_to_account_id: 'acc-2',
        transaction_date: '2026-07-03'
      }), // Transfer should be neutral
      createMockTransaction({ transaction_type: 'income', amount: 1000, transaction_date: '2026-08-01' }) // Out of date period
    ]

    it('should calculate income in range excluding transfers', () => {
      const income = calculatePeriodIncome(transactions, '2026-07-01', '2026-07-31')
      expect(income).toBe(5000)
    })

    it('should calculate expenses in range excluding transfers', () => {
      const expenses = calculatePeriodExpenses(transactions, '2026-07-01', '2026-07-31')
      expect(expenses).toBe(1200)
    })

    it('should calculate savings in range correctly', () => {
      const savings = calculatePeriodSavings(transactions, '2026-07-01', '2026-07-31')
      expect(savings).toBe(3800) // 5000 - 1200
    })
  })

  describe('5. Savings Rate & Zero Guards', () => {
    it('should calculate correct savings rates', () => {
      expect(calculateSavingsRate(1000, 200)).toBe(80) // (800 / 1000) * 100
      expect(calculateSavingsRate(500, 500)).toBe(0)
      expect(calculateSavingsRate(500, 600)).toBe(-20) // Deficit
    })

    it('should prevent divide-by-zero when income is zero', () => {
      expect(calculateSavingsRate(0, 500)).toBe(0)
    })
  })

  describe('6. Decimal Rounding & Float Safety', () => {
    it('should accumulate decimal transactions without IEEE-754 binary floating-point drift', () => {
      const txs = [
        createMockTransaction({ transaction_type: 'income', amount: 0.1 }),
        createMockTransaction({ transaction_type: 'income', amount: 0.2 }),
      ]
      // Standard binary float would yield 0.30000000000000004
      const sum = calculatePeriodIncome(txs)
      expect(sum).toBe(0.3)
    })
  })

  describe('7. Indian Financial Year Bounds', () => {
    it('should determine the correct FY boundaries', () => {
      // Test Date: April 15, 2026 -> FY starts April 1, 2026, ends March 31, 2027
      const bounds1 = getIndianFinancialYear(new Date('2026-04-15'))
      expect(bounds1.start).toBe('2026-04-01')
      expect(bounds1.end).toBe('2027-03-31')

      // Test Date: February 10, 2026 -> FY starts April 1, 2025, ends March 31, 2026
      const bounds2 = getIndianFinancialYear(new Date('2026-02-10'))
      expect(bounds2.start).toBe('2025-04-01')
      expect(bounds2.end).toBe('2026-03-31')
    })
  })

  describe('8. Goal Planning Calculations', () => {
    it('should calculate remaining target', () => {
      expect(calculateGoalRemaining(10000, 3500)).toBe(6500)
      expect(calculateGoalRemaining(10000, 12000)).toBe(0) // Goal completed
    })

    it('should calculate progress percentage including target zero check', () => {
      expect(calculateGoalProgressPercentage(10000, 5000)).toBe(50)
      expect(calculateGoalProgressPercentage(0, 5000)).toBe(0) // Safe check
    })

    it('should calculate monthly/weekly saving targets', () => {
      // Remaining = 6000. Targets: 3 months, 12 weeks.
      expect(calculateRequiredMonthlySavings(6000, '2026-10-04', '2026-07-04')).toBe(2000)
      expect(calculateRequiredWeeklySavings(6000, '2026-09-26', '2026-07-04')).toBe(500)
    })
  })

  describe('9. Empty Dataset Resilience', () => {
    it('should return 0 for summaries when empty', () => {
      expect(calculatePeriodIncome([])).toBe(0)
      expect(calculatePeriodExpenses([])).toBe(0)
      expect(calculatePeriodSavings([])).toBe(0)
      expect(calculateGoalSavedAmount([])).toBe(0)
      expect(calculateCategorySpending([])).toEqual({})
    })
  })

  describe('10. Period Spending Comparison', () => {
    it('should calculate percent change correctly', () => {
      const txs = [
        createMockTransaction({ transaction_type: 'expense', amount: 1500, transaction_date: '2026-07-10' }),
        createMockTransaction({ transaction_type: 'expense', amount: 1000, transaction_date: '2026-06-15' }),
      ]
      const comparison = comparePeriodSpending(txs, '2026-07-01', '2026-07-31', '2026-06-01', '2026-06-30')
      expect(comparison.current).toBe(1500)
      expect(comparison.previous).toBe(1000)
      expect(comparison.percentChange).toBe(50)
    })
  })

  describe('11. Identify Largest Expense Category', () => {
    it('should correctly select the category with maximum spending', () => {
      const categories: Category[] = [
        { id: 'cat-food', name: 'Food', transaction_type: 'expense', user_id: null, is_system: true, is_active: true, icon: null, created_at: '', updated_at: '' },
        { id: 'cat-rent', name: 'Rent', transaction_type: 'expense', user_id: null, is_system: true, is_active: true, icon: null, created_at: '', updated_at: '' }
      ]
      const txs = [
        createMockTransaction({ transaction_type: 'expense', amount: 400, category_id: 'cat-food' }),
        createMockTransaction({ transaction_type: 'expense', amount: 1200, category_id: 'cat-rent' }),
        createMockTransaction({ transaction_type: 'expense', amount: 300, category_id: 'cat-food' }),
      ]
      const largest = identifyLargestExpenseCategory(txs, categories)
      expect(largest.category?.name).toBe('Rent')
      expect(largest.amount).toBe(1200)
    })
  })

  describe('12. Date Planning Remaining Bounds', () => {
    it('should calculate remaining months and weeks between two date boundaries', () => {
      expect(getRemainingMonths('2026-07-04', '2026-10-04')).toBe(3)
      expect(getRemainingWeeks('2026-07-04', '2026-09-26')).toBe(12)
    })
  })
})
