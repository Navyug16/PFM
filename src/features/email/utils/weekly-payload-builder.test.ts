import { describe, test, expect } from 'vitest'
import { buildWeeklyEmailPayload } from './weekly-payload-builder'
import type { Transaction, Category } from '@/features/financial/types'
import type { EmailUserContext } from '../types/email'

describe('M14 Phase 3.3 — Weekly Email Payload Builder Suite', () => {
  const mockUser: EmailUserContext = {
    displayName: 'Alex Rivers',
    currency: 'INR',
    locale: 'en-IN',
    dateFormat: 'YYYY-MM-DD',
  }

  const mockCategories: Category[] = [
    {
      id: 'cat-groceries',
      user_id: 'user-1',
      name: 'Groceries',
      transaction_type: 'expense',
      icon: 'shopping-cart',
      is_system: true,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'cat-dining',
      user_id: 'user-1',
      name: 'Dining & Food',
      transaction_type: 'expense',
      icon: 'utensils',
      is_system: true,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'cat-salary',
      user_id: 'user-1',
      name: 'Salary',
      transaction_type: 'income',
      icon: 'briefcase',
      is_system: true,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ]

  const mockCurrentTxs: Transaction[] = [
    {
      id: 'tx-1',
      user_id: 'user-1',
      transaction_type: 'income',
      amount: 50000,
      account_id: 'acc-1',
      category_id: 'cat-salary',
      transfer_to_account_id: null,
      transaction_date: '2026-09-08',
      payee_or_source: 'Employer Corp',
      notes: null,
      created_at: '2026-09-08T00:00:00Z',
      updated_at: '2026-09-08T00:00:00Z',
    },
    {
      id: 'tx-2',
      user_id: 'user-1',
      transaction_type: 'expense',
      amount: 6000,
      account_id: 'acc-1',
      category_id: 'cat-groceries',
      transfer_to_account_id: null,
      transaction_date: '2026-09-09',
      payee_or_source: 'Supermarket',
      notes: null,
      created_at: '2026-09-09T00:00:00Z',
      updated_at: '2026-09-09T00:00:00Z',
    },
    {
      id: 'tx-3',
      user_id: 'user-1',
      transaction_type: 'expense',
      amount: 4000,
      account_id: 'acc-1',
      category_id: 'cat-dining',
      transfer_to_account_id: null,
      transaction_date: '2026-09-10',
      payee_or_source: 'Bistro',
      notes: null,
      created_at: '2026-09-10T00:00:00Z',
      updated_at: '2026-09-10T00:00:00Z',
    },
  ]

  const mockPrevTxs: Transaction[] = [
    {
      id: 'tx-prev-1',
      user_id: 'user-1',
      transaction_type: 'expense',
      amount: 15000,
      account_id: 'acc-1',
      category_id: 'cat-groceries',
      transfer_to_account_id: null,
      transaction_date: '2026-09-02',
      payee_or_source: 'Supermarket',
      notes: null,
      created_at: '2026-09-02T00:00:00Z',
      updated_at: '2026-09-02T00:00:00Z',
    },
  ]

  test('1. Builds trusted payload for normal weekly scenario', () => {
    const payload = buildWeeklyEmailPayload({
      user: mockUser,
      transactions: mockCurrentTxs,
      prevTransactions: mockPrevTxs,
      categories: mockCategories,
      startDate: '2026-09-07',
      endDate: '2026-09-13',
      prevStartDate: '2026-08-31',
      prevEndDate: '2026-09-06',
    })

    expect(payload.reportType).toBe('weekly')
    expect(payload.user.displayName).toBe('Alex Rivers')
    expect(payload.period.startDate).toBe('2026-09-07')
    expect(payload.period.endDate).toBe('2026-09-13')

    // Summary calculations
    expect(payload.summary.totalIncome).toBe(50000)
    expect(payload.summary.totalExpenses).toBe(10000)
    expect(payload.summary.netSavings).toBe(40000)
    expect(payload.summary.savingsRate).toBe(80)
    expect(payload.summary.previousPeriodExpenses).toBe(15000)
    expect(payload.summary.expensePercentChange).toBe(-33.33)

    // Category breakdown and Top Category
    expect(payload.categories.length).toBe(2)
    expect(payload.topCategory?.categoryId).toBe('cat-groceries')
    expect(payload.topCategory?.amount).toBe(6000)
    expect(payload.topCategory?.percentage).toBe(60)

    // Insights mapped
    expect(payload.insights.length).toBeGreaterThan(0)
  })

  test('2. Handles Zero-Data scenario safely without errors or NaN', () => {
    const payload = buildWeeklyEmailPayload({
      user: mockUser,
      transactions: [],
      prevTransactions: [],
      categories: mockCategories,
      startDate: '2026-09-07',
      endDate: '2026-09-13',
      prevStartDate: '2026-08-31',
      prevEndDate: '2026-09-06',
    })

    expect(payload.reportType).toBe('weekly')
    expect(payload.summary.totalIncome).toBe(0)
    expect(payload.summary.totalExpenses).toBe(0)
    expect(payload.summary.netSavings).toBe(0)
    expect(payload.summary.savingsRate).toBe(0)
    expect(payload.summary.previousPeriodExpenses).toBe(0)
    expect(payload.summary.expensePercentChange).toBe(0)
    expect(payload.categories).toEqual([])
    expect(payload.topCategory).toBeUndefined()
  })

  test('3. Maps Negative Cash Flow deterministic insight when expenses > income', () => {
    const expenseOnlyTxs: Transaction[] = [
      {
        id: 'tx-exp-only',
        user_id: 'user-1',
        transaction_type: 'expense',
        amount: 8000,
        account_id: 'acc-1',
        category_id: 'cat-groceries',
        transfer_to_account_id: null,
        transaction_date: '2026-09-09',
        payee_or_source: 'Store',
        notes: null,
        created_at: '2026-09-09T00:00:00Z',
        updated_at: '2026-09-09T00:00:00Z',
      },
    ]

    const payload = buildWeeklyEmailPayload({
      user: mockUser,
      transactions: expenseOnlyTxs,
      prevTransactions: [],
      categories: mockCategories,
      startDate: '2026-09-07',
      endDate: '2026-09-13',
      prevStartDate: '2026-08-31',
      prevEndDate: '2026-09-06',
    })

    expect(payload.summary.netSavings).toBe(-8000)
    const negativeCashFlowInsight = payload.insights.find((i) => i.type === 'negative_cash_flow')
    expect(negativeCashFlowInsight).toBeDefined()
    expect(negativeCashFlowInsight?.severity).toBe('important')
  })

  test('4. Maps Category Concentration deterministic insight when top category > 35%', () => {
    const payload = buildWeeklyEmailPayload({
      user: mockUser,
      transactions: mockCurrentTxs,
      prevTransactions: mockPrevTxs,
      categories: mockCategories,
      startDate: '2026-09-07',
      endDate: '2026-09-13',
      prevStartDate: '2026-08-31',
      prevEndDate: '2026-09-06',
    })

    // Groceries is 60% of total expenses (> 35%)
    const concentrationInsight = payload.insights.find((i) => i.type === 'category_concentration')
    expect(concentrationInsight).toBeDefined()
  })

  test('5. Verifies Function Purity: Does NOT mutate input parameters', () => {
    const origUser = { ...mockUser }
    const origCurrentTxs = JSON.parse(JSON.stringify(mockCurrentTxs))
    const origPrevTxs = JSON.parse(JSON.stringify(mockPrevTxs))
    const origCategories = JSON.parse(JSON.stringify(mockCategories))

    buildWeeklyEmailPayload({
      user: mockUser,
      transactions: mockCurrentTxs,
      prevTransactions: mockPrevTxs,
      categories: mockCategories,
      startDate: '2026-09-07',
      endDate: '2026-09-13',
      prevStartDate: '2026-08-31',
      prevEndDate: '2026-09-06',
    })

    expect(mockUser).toEqual(origUser)
    expect(mockCurrentTxs).toEqual(origCurrentTxs)
    expect(mockPrevTxs).toEqual(origPrevTxs)
    expect(mockCategories).toEqual(origCategories)
  })
})
