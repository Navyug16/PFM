import { describe, test, expect } from 'vitest'
import { buildMonthlyEmailPayload } from './monthly-payload-builder'
import type { Transaction, Category } from '@/features/financial/types'
import type { EmailUserContext } from '../types/email'

describe('M14 Phase 3.4 — Monthly Email Payload Builder Suite', () => {
  const mockUser: EmailUserContext = {
    displayName: 'Alex Rivers',
    currency: 'INR',
    locale: 'en-IN',
    dateFormat: 'YYYY-MM-DD',
  }

  const mockCategories: Category[] = [
    {
      id: 'cat-rent',
      user_id: 'user-1',
      name: 'Rent & Housing',
      transaction_type: 'expense',
      icon: 'home',
      is_system: true,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
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
      amount: 100000,
      account_id: 'acc-1',
      category_id: 'cat-salary',
      transfer_to_account_id: null,
      transaction_date: '2026-08-01',
      payee_or_source: 'Employer Corp',
      notes: null,
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-08-01T00:00:00Z',
    },
    {
      id: 'tx-2',
      user_id: 'user-1',
      transaction_type: 'expense',
      amount: 25000,
      account_id: 'acc-1',
      category_id: 'cat-rent',
      transfer_to_account_id: null,
      transaction_date: '2026-08-05',
      payee_or_source: 'Landlord',
      notes: null,
      created_at: '2026-08-05T00:00:00Z',
      updated_at: '2026-08-05T00:00:00Z',
    },
    {
      id: 'tx-3',
      user_id: 'user-1',
      transaction_type: 'expense',
      amount: 15000,
      account_id: 'acc-1',
      category_id: 'cat-groceries',
      transfer_to_account_id: null,
      transaction_date: '2026-08-15',
      payee_or_source: 'Supermarket',
      notes: null,
      created_at: '2026-08-15T00:00:00Z',
      updated_at: '2026-08-15T00:00:00Z',
    },
  ]

  const mockPrevTxs: Transaction[] = [
    {
      id: 'tx-prev-1',
      user_id: 'user-1',
      transaction_type: 'expense',
      amount: 30000,
      account_id: 'acc-1',
      category_id: 'cat-rent',
      transfer_to_account_id: null,
      transaction_date: '2026-07-05',
      payee_or_source: 'Landlord',
      notes: null,
      created_at: '2026-07-05T00:00:00Z',
      updated_at: '2026-07-05T00:00:00Z',
    },
  ]

  test('1. Normal monthly scenario: Builds trusted payload with reportType: "monthly"', () => {
    const payload = buildMonthlyEmailPayload({
      user: mockUser,
      transactions: mockCurrentTxs,
      prevTransactions: mockPrevTxs,
      categories: mockCategories,
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      prevStartDate: '2026-07-01',
      prevEndDate: '2026-07-31',
    })

    expect(payload.reportType).toBe('monthly')
    expect(payload.user.displayName).toBe('Alex Rivers')
    expect(payload.period.startDate).toBe('2026-08-01')
    expect(payload.period.endDate).toBe('2026-08-31')

    // Financial Summary
    expect(payload.summary.totalIncome).toBe(100000)
    expect(payload.summary.totalExpenses).toBe(40000)
    expect(payload.summary.netSavings).toBe(60000)
    expect(payload.summary.savingsRate).toBe(60)
    expect(payload.summary.previousPeriodExpenses).toBe(30000)
    expect(payload.summary.expensePercentChange).toBe(33.33)

    // Category Breakdown & Top Category
    expect(payload.categories.length).toBe(2)
    expect(payload.topCategory?.categoryId).toBe('cat-rent')
    expect(payload.topCategory?.amount).toBe(25000)
    expect(payload.topCategory?.percentage).toBe(62.5)

    // Deterministic Insights
    expect(payload.insights.length).toBeGreaterThan(0)
  })

  test('2. Zero-data month: Handles empty transactions cleanly without NaN or Infinity', () => {
    const payload = buildMonthlyEmailPayload({
      user: mockUser,
      transactions: [],
      prevTransactions: [],
      categories: mockCategories,
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      prevStartDate: '2026-07-01',
      prevEndDate: '2026-07-31',
    })

    expect(payload.reportType).toBe('monthly')
    expect(payload.summary.totalIncome).toBe(0)
    expect(payload.summary.totalExpenses).toBe(0)
    expect(payload.summary.netSavings).toBe(0)
    expect(payload.summary.savingsRate).toBe(0)
    expect(payload.summary.previousPeriodExpenses).toBe(0)
    expect(payload.summary.expensePercentChange).toBe(0)
    expect(payload.categories).toEqual([])
    expect(payload.topCategory).toBeUndefined()
    expect(Number.isNaN(payload.summary.totalExpenses)).toBe(false)
    expect(Number.isNaN(payload.summary.savingsRate)).toBe(false)
  })

  test('3. Negative cash flow: Maps negative cash flow insight when expenses > income', () => {
    const deficitTxs: Transaction[] = [
      {
        id: 'tx-deficit',
        user_id: 'user-1',
        transaction_type: 'expense',
        amount: 150000,
        account_id: 'acc-1',
        category_id: 'cat-rent',
        transfer_to_account_id: null,
        transaction_date: '2026-08-05',
        payee_or_source: 'Landlord',
        notes: null,
        created_at: '2026-08-05T00:00:00Z',
        updated_at: '2026-08-05T00:00:00Z',
      },
    ]

    const payload = buildMonthlyEmailPayload({
      user: mockUser,
      transactions: deficitTxs,
      prevTransactions: [],
      categories: mockCategories,
      startDate: '2026-08-01',
      endDate: '2026-08-31',
    })

    expect(payload.summary.netSavings).toBe(-150000)
    const negativeCashFlowInsight = payload.insights.find((i) => i.type === 'negative_cash_flow')
    expect(negativeCashFlowInsight).toBeDefined()
    expect(negativeCashFlowInsight?.severity).toBe('important')
  })

  test('4. Spending increase: Maps spending growth insight when current > prev by >15%', () => {
    const highExpenseTxs: Transaction[] = [
      {
        id: 'tx-high',
        user_id: 'user-1',
        transaction_type: 'expense',
        amount: 50000,
        account_id: 'acc-1',
        category_id: 'cat-rent',
        transfer_to_account_id: null,
        transaction_date: '2026-08-05',
        payee_or_source: 'Landlord',
        notes: null,
        created_at: '2026-08-05T00:00:00Z',
        updated_at: '2026-08-05T00:00:00Z',
      },
    ]

    const payload = buildMonthlyEmailPayload({
      user: mockUser,
      transactions: highExpenseTxs,
      prevTransactions: mockPrevTxs, // 30,000 prev expenses
      categories: mockCategories,
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      prevStartDate: '2026-07-01',
      prevEndDate: '2026-07-31',
    })

    expect(payload.summary.expensePercentChange).toBe(66.67)
    const spendingIncreaseInsight = payload.insights.find((i) => i.type === 'spending_increase')
    expect(spendingIncreaseInsight).toBeDefined()
    expect(spendingIncreaseInsight?.severity).toBe('important')
  })

  test('5. Spending decrease: Maps spending reduction insight when current < prev by <-10%', () => {
    const lowExpenseTxs: Transaction[] = [
      {
        id: 'tx-low',
        user_id: 'user-1',
        transaction_type: 'expense',
        amount: 15000,
        account_id: 'acc-1',
        category_id: 'cat-rent',
        transfer_to_account_id: null,
        transaction_date: '2026-08-05',
        payee_or_source: 'Landlord',
        notes: null,
        created_at: '2026-08-05T00:00:00Z',
        updated_at: '2026-08-05T00:00:00Z',
      },
    ]

    const payload = buildMonthlyEmailPayload({
      user: mockUser,
      transactions: lowExpenseTxs,
      prevTransactions: mockPrevTxs, // 30,000 prev expenses
      categories: mockCategories,
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      prevStartDate: '2026-07-01',
      prevEndDate: '2026-07-31',
    })

    expect(payload.summary.expensePercentChange).toBe(-50)
    const spendingDecreaseInsight = payload.insights.find((i) => i.type === 'spending_decrease')
    expect(spendingDecreaseInsight).toBeDefined()
    expect(spendingDecreaseInsight?.severity).toBe('positive')
  })

  test('6. Category concentration: Maps insight when top category > 35%', () => {
    const payload = buildMonthlyEmailPayload({
      user: mockUser,
      transactions: mockCurrentTxs,
      prevTransactions: mockPrevTxs,
      categories: mockCategories,
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      prevStartDate: '2026-07-01',
      prevEndDate: '2026-07-31',
    })

    // Rent is 62.5% of total expenses (> 35%)
    expect(payload.topCategory?.percentage).toBe(62.5)
    const concentrationInsight = payload.insights.find((i) => i.type === 'category_concentration')
    expect(concentrationInsight).toBeDefined()
  })

  test('7. Previous-period baseline unavailable: Handles missing prev baseline safely', () => {
    const payload = buildMonthlyEmailPayload({
      user: mockUser,
      transactions: mockCurrentTxs,
      prevTransactions: [],
      categories: mockCategories,
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      // prevStartDate and prevEndDate omitted
    })

    expect(payload.reportType).toBe('monthly')
    expect(payload.summary.previousPeriodExpenses).toBe(0)
    expect(payload.summary.expensePercentChange).toBe(100)
    expect(payload.period.startDate).toBe('2026-08-01')
  })

  test('8. Contract integrity: Output strictly matches EmailReportPayload structure', () => {
    const payload = buildMonthlyEmailPayload({
      user: mockUser,
      transactions: mockCurrentTxs,
      prevTransactions: mockPrevTxs,
      categories: mockCategories,
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      prevStartDate: '2026-07-01',
      prevEndDate: '2026-07-31',
    })

    // Contract keys verification
    expect(payload).toHaveProperty('reportType')
    expect(payload).toHaveProperty('generatedAt')
    expect(payload).toHaveProperty('user')
    expect(payload).toHaveProperty('period')
    expect(payload).toHaveProperty('summary')
    expect(payload).toHaveProperty('categories')
    expect(payload).toHaveProperty('insights')

    expect(payload.reportType).toBe('monthly')
    expect(typeof payload.generatedAt).toBe('string')
    expect(new Date(payload.generatedAt).toString()).not.toBe('Invalid Date')
  })

  test('9. Input immutability: Does NOT mutate input parameters', () => {
    const origUser = { ...mockUser }
    const origCurrentTxs = JSON.parse(JSON.stringify(mockCurrentTxs))
    const origPrevTxs = JSON.parse(JSON.stringify(mockPrevTxs))
    const origCategories = JSON.parse(JSON.stringify(mockCategories))

    buildMonthlyEmailPayload({
      user: mockUser,
      transactions: mockCurrentTxs,
      prevTransactions: mockPrevTxs,
      categories: mockCategories,
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      prevStartDate: '2026-07-01',
      prevEndDate: '2026-07-31',
    })

    expect(mockUser).toEqual(origUser)
    expect(mockCurrentTxs).toEqual(origCurrentTxs)
    expect(mockPrevTxs).toEqual(origPrevTxs)
    expect(mockCategories).toEqual(origCategories)
  })
})
