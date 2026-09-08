import { describe, it, expect } from 'vitest'
import {
  parseQuestion,
  executeQuestionIntent,
  matchCategoryFromQuery,
  resolveQuestionPeriod,
  SUGGESTED_QUESTIONS
} from './question-engine'
import type { Transaction, Account, Category } from '@/features/financial/types'

describe('Deterministic Question Engine', () => {
  const mockCategories: Category[] = [
    { id: 'cat-1', user_id: 'usr-1', name: 'Food & Dining', transaction_type: 'expense', icon: 'Utensils', is_system: false, is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { id: 'cat-2', user_id: 'usr-1', name: 'Housing & Rent', transaction_type: 'expense', icon: 'Home', is_system: false, is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { id: 'cat-3', user_id: 'usr-1', name: 'Shopping', transaction_type: 'expense', icon: 'ShoppingBag', is_system: false, is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { id: 'cat-4', user_id: 'usr-1', name: 'Travel & Transport', transaction_type: 'expense', icon: 'Car', is_system: false, is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }
  ]

  const mockAccounts: Account[] = [
    {
      id: 'acc-1',
      name: 'Main Checking',
      account_type: 'checking',
      currency_code: 'INR',
      opening_balance: 50000,
      is_active: true,
      user_id: 'usr-1',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z'
    },
    {
      id: 'acc-2',
      name: 'High Yield Savings',
      account_type: 'savings',
      currency_code: 'INR',
      opening_balance: 100000,
      is_active: true,
      user_id: 'usr-1',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z'
    }
  ]

  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      account_id: 'acc-1',
      category_id: 'cat-1',
      transfer_to_account_id: null,
      transaction_date: '2026-09-02',
      amount: 1500,
      transaction_type: 'expense',
      payee_or_source: 'Supermarket',
      notes: 'Grocery dinner',
      user_id: 'usr-1',
      created_at: '2026-09-02T10:00:00Z',
      updated_at: '2026-09-02T10:00:00Z'
    },
    {
      id: 'tx-2',
      account_id: 'acc-1',
      category_id: 'cat-2',
      transfer_to_account_id: null,
      transaction_date: '2026-09-05',
      amount: 25000,
      transaction_type: 'expense',
      payee_or_source: 'Landlord',
      notes: 'Monthly rent',
      user_id: 'usr-1',
      created_at: '2026-09-05T10:00:00Z',
      updated_at: '2026-09-05T10:00:00Z'
    },
    {
      id: 'tx-3',
      account_id: 'acc-1',
      category_id: null,
      transfer_to_account_id: null,
      transaction_date: '2026-09-01',
      amount: 80000,
      transaction_type: 'income',
      payee_or_source: 'Employer Inc',
      notes: 'Monthly salary',
      user_id: 'usr-1',
      created_at: '2026-09-01T08:00:00Z',
      updated_at: '2026-09-01T08:00:00Z'
    }
  ]

  describe('1. Category Matching', () => {
    it('matches exact category name case-insensitively', () => {
      const match = matchCategoryFromQuery('how much did i spend on food & dining?', mockCategories)
      expect(match?.name).toBe('Food & Dining')
    })

    it('matches category name substring cleanly', () => {
      const match = matchCategoryFromQuery('show shopping expenses', mockCategories)
      expect(match?.name).toBe('Shopping')
    })

    it('returns null when no category matches', () => {
      const match = matchCategoryFromQuery('how much on electronics?', mockCategories)
      expect(match).toBeNull()
    })
  })

  describe('2. Period Resolution & Precedence', () => {
    it('resolves explicit period phrase in query over fallback', () => {
      const res = resolveQuestionPeriod('how much did i spend last month?', 'this_month')
      expect(res.preset).toBe('last_month')
      expect(res.isExplicit).toBe(true)
    })

    it('falls back to active Insights preset when no period phrase is in query', () => {
      const res = resolveQuestionPeriod('how much did i spend?', 'this_month')
      expect(res.preset).toBe('this_month')
      expect(res.isExplicit).toBe(false)
    })

    it('identifies unsupported future period phrase', () => {
      const res = resolveQuestionPeriod('how much will i spend next month?', 'this_month')
      expect(res.isUnsupported).toBe(true)
    })
  })

  describe('3. Intent Parsing (All 14 Supported Intents)', () => {
    it('parses total_income', () => {
      const parsed = parseQuestion('How much did I earn this month?', mockCategories, 'this_month')
      expect(parsed.intent).toBe('total_income')
    })

    it('parses total_expenses', () => {
      const parsed = parseQuestion('How much did I spend this period?', mockCategories, 'this_month')
      expect(parsed.intent).toBe('total_expenses')
    })

    it('parses period_savings', () => {
      const parsed = parseQuestion('How much did I save this month?', mockCategories, 'this_month')
      expect(parsed.intent).toBe('period_savings')
    })

    it('parses savings_rate', () => {
      const parsed = parseQuestion('What is my savings rate?', mockCategories, 'this_month')
      expect(parsed.intent).toBe('savings_rate')
    })

    it('parses available_balance', () => {
      const parsed = parseQuestion('What is my available balance?', mockCategories, 'this_month')
      expect(parsed.intent).toBe('available_balance')
    })

    it('parses account_balance / net_position', () => {
      const parsed = parseQuestion('What is my net financial position?', mockCategories, 'this_month')
      expect(parsed.intent).toBe('net_position')
    })

    it('parses category_spending with matched category', () => {
      const parsed = parseQuestion('How much did I spend on Food & Dining?', mockCategories, 'this_month')
      expect(parsed.intent).toBe('category_spending')
      expect(parsed.matchedCategory?.name).toBe('Food & Dining')
    })

    it('parses largest_spending_category', () => {
      const parsed = parseQuestion('What was my largest spending category?', mockCategories, 'this_month')
      expect(parsed.intent).toBe('largest_spending_category')
    })

    it('parses income_vs_expenses', () => {
      const parsed = parseQuestion('What is my income vs expenses breakdown?', mockCategories, 'this_month')
      expect(parsed.intent).toBe('income_vs_expenses')
    })

    it('parses period_expense_comparison', () => {
      const parsed = parseQuestion('How do my expenses compare to last month?', mockCategories, 'this_month')
      expect(parsed.intent).toBe('period_expense_comparison')
    })

    it('parses period_income_comparison', () => {
      const parsed = parseQuestion('How does my income compare to last period?', mockCategories, 'this_month')
      expect(parsed.intent).toBe('period_income_comparison')
    })

    it('parses savings_comparison', () => {
      const parsed = parseQuestion('How do my savings compare to last period?', mockCategories, 'this_month')
      expect(parsed.intent).toBe('savings_comparison')
    })

    it('parses transaction_count', () => {
      const parsed = parseQuestion('How many transactions were logged?', mockCategories, 'this_month')
      expect(parsed.intent).toBe('transaction_count')
    })

    it('rejects predictive/AI queries as unsupported', () => {
      const parsed = parseQuestion('Should I buy a new car next month?', mockCategories, 'this_month')
      expect(parsed.intent).toBe('unsupported')
      expect(parsed.unsupportedReason).toBeDefined()
    })
  })

  describe('4. Metric Execution (Using Trusted Calculations)', () => {
    it('executes total_income correctly', () => {
      const parsed = parseQuestion('How much did I earn this month?', mockCategories, 'this_month')
      const result = executeQuestionIntent({
        intent: parsed.intent,
        matchedCategory: parsed.matchedCategory,
        periodPreset: parsed.periodPreset,
        periodLabel: parsed.periodLabel,
        transactions: mockTransactions,
        accounts: mockAccounts,
        categories: mockCategories
      })
      expect(result.status).toBe('success')
      expect(result.metricValue).toBe(80000)
      expect(result.explanation).toContain('80,000')
    })

    it('executes category_spending for Housing & Rent', () => {
      const parsed = parseQuestion('How much did I spend on Housing & Rent?', mockCategories, 'this_month')
      const result = executeQuestionIntent({
        intent: parsed.intent,
        matchedCategory: parsed.matchedCategory,
        periodPreset: parsed.periodPreset,
        periodLabel: parsed.periodLabel,
        transactions: mockTransactions,
        accounts: mockAccounts,
        categories: mockCategories
      })
      expect(result.status).toBe('success')
      expect(result.categoryName).toBe('Housing & Rent')
      expect(result.metricValue).toBe(25000)
    })

    it('handles zero-data category gracefully', () => {
      const parsed = parseQuestion('How much did I spend on Travel & Transport?', mockCategories, 'this_month')
      const result = executeQuestionIntent({
        intent: parsed.intent,
        matchedCategory: parsed.matchedCategory,
        periodPreset: parsed.periodPreset,
        periodLabel: parsed.periodLabel,
        transactions: mockTransactions,
        accounts: mockAccounts,
        categories: mockCategories
      })
      expect(result.status).toBe('success')
      expect(result.metricValue).toBe(0)
    })

    it('handles unsupported query cleanly', () => {
      const result = executeQuestionIntent({
        intent: 'unsupported',
        matchedCategory: null,
        periodPreset: 'this_month',
        periodLabel: 'This Month',
        transactions: mockTransactions,
        accounts: mockAccounts,
        categories: mockCategories
      })
      expect(result.status).toBe('unsupported')
      expect(result.metricValue).toBeNull()
    })
  })

  describe('5. Suggested Questions Registry', () => {
    it('provides valid suggested questions list', () => {
      expect(SUGGESTED_QUESTIONS.length).toBeGreaterThanOrEqual(8)
      SUGGESTED_QUESTIONS.forEach((q) => {
        expect(q.id).toBeDefined()
        expect(q.text).toBeDefined()
        expect(q.intent).toBeDefined()
      })
    })
  })
})
