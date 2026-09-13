import { describe, test, expect } from 'vitest'
import type { EmailReportPayload, EmailOptionalReportExtensions } from './email'

describe('M14 Phase 3.2 — Email Report Payload Type Contract Validation', () => {
  test('1. Validates Weekly EmailReportPayload core contract structure', () => {
    const weeklyPayload: EmailReportPayload = {
      reportType: 'weekly',
      generatedAt: '2026-09-13T12:00:00.000Z',
      user: {
        displayName: 'John Doe',
        currency: 'INR',
        locale: 'en-IN',
        dateFormat: 'YYYY-MM-DD',
      },
      period: {
        startDate: '2026-09-07',
        endDate: '2026-09-13',
        formattedRange: 'Sep 07, 2026 – Sep 13, 2026',
      },
      summary: {
        totalIncome: 50000,
        totalExpenses: 12000,
        netSavings: 38000,
        savingsRate: 76,
        previousPeriodExpenses: 15000,
        expensePercentChange: -20,
      },
      categories: [
        {
          categoryId: 'cat-groceries',
          categoryName: 'Groceries',
          amount: 5000,
          percentage: 41.67,
          transactionCount: 3,
          direction: 'down',
        },
      ],
      topCategory: {
        categoryId: 'cat-groceries',
        categoryName: 'Groceries',
        amount: 5000,
        percentage: 41.67,
      },
      insights: [
        {
          id: 'insight-1',
          type: 'spending_decrease',
          title: 'Lower Weekly Spending',
          statement: 'Expenses dropped by 20.0% compared to last week.',
          severity: 'positive',
        },
      ],
    }

    expect(weeklyPayload.reportType).toBe('weekly')
    expect(weeklyPayload.period.startDate).toBe('2026-09-07')
    expect(weeklyPayload.period.endDate).toBe('2026-09-13')
    expect(weeklyPayload.summary.netSavings).toBe(38000)
    expect(weeklyPayload.categories[0].direction).toBe('down')
    expect(weeklyPayload.insights[0].type).toBe('spending_decrease')
  })

  test('2. Validates Monthly EmailReportPayload core contract structure and separate extension typing', () => {
    const monthlyPayload: EmailReportPayload = {
      reportType: 'monthly',
      generatedAt: '2026-09-01T00:00:00.000Z',
      user: {
        displayName: 'Jane Smith',
        currency: 'USD',
        locale: 'en-US',
        dateFormat: 'YYYY-MM-DD',
      },
      period: {
        startDate: '2026-08-01',
        endDate: '2026-08-31',
        formattedRange: 'August 2026',
      },
      summary: {
        totalIncome: 8000,
        totalExpenses: 3500,
        netSavings: 4500,
        savingsRate: 56.25,
      },
      categories: [
        {
          categoryId: 'cat-rent',
          categoryName: 'Housing & Rent',
          amount: 2000,
          percentage: 57.14,
          transactionCount: 1,
          direction: 'unchanged',
        },
      ],
      insights: [
        {
          id: 'insight-monthly-1',
          type: 'category_concentration',
          title: 'High Housing Share',
          statement: 'Housing & Rent accounts for 57.1% of monthly expenses.',
          severity: 'neutral',
        },
      ],
    }

    const extensions: EmailOptionalReportExtensions = {
      budget: {
        totalLimit: 4000,
        totalSpent: 3500,
        overallPercentage: 87.5,
      },
      goals: {
        activeGoalsCount: 3,
        onTrackCount: 2,
        behindCount: 1,
      },
      recurring: {
        totalMonthlyCommitments: 1200,
        recurringRatio: 34.29,
      },
    }

    expect(monthlyPayload.reportType).toBe('monthly')
    expect(monthlyPayload.summary.totalIncome).toBe(8000)
    expect(extensions.budget?.totalLimit).toBe(4000)
    expect(extensions.goals?.activeGoalsCount).toBe(3)
    expect(extensions.recurring?.totalMonthlyCommitments).toBe(1200)
  })
})
