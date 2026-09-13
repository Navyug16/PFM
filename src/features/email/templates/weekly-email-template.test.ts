import { describe, it, expect } from 'vitest'
import { renderWeeklyEmail } from './weekly-email-template'
import type { EmailReportPayload } from '../types/email'

describe('renderWeeklyEmail Template Renderer', () => {
  const createBaseWeeklyPayload = (): EmailReportPayload => ({
    reportType: 'weekly',
    generatedAt: '2026-09-13T10:00:00.000Z',
    user: {
      displayName: 'Alex Morgan',
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
      totalExpenses: 20000,
      netSavings: 30000,
      savingsRate: 60,
      previousPeriodExpenses: 18000,
      expensePercentChange: 11.1,
    },
    categories: [
      {
        categoryId: 'cat-housing',
        categoryName: 'Housing',
        amount: 12000,
        percentage: 60,
        transactionCount: 2,
        direction: 'up',
      },
      {
        categoryId: 'cat-food',
        categoryName: 'Food & Dining',
        amount: 8000,
        percentage: 40,
        transactionCount: 5,
        direction: 'down',
      },
    ],
    topCategory: {
      categoryId: 'cat-housing',
      categoryName: 'Housing',
      amount: 12000,
      percentage: 60,
      transactionCount: 2,
      direction: 'up',
    },
    insights: [
      {
        id: 'ins-1',
        type: 'spending_increase',
        title: 'Weekly Expense Spike',
        statement: 'Expenses increased by 11.1% compared to previous week.',
        severity: 'review',
      },
    ],
  })

  it('1. renders normal weekly email with valid HTML structure and metrics', () => {
    const payload = createBaseWeeklyPayload()
    const html = renderWeeklyEmail(payload)

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('Weekly Financial Summary')
    expect(html).toContain('Hi Alex Morgan')
    expect(html).toContain('Sep 07, 2026 – Sep 13, 2026')
    expect(html).toContain('Housing')
    expect(html).toContain('Food &amp; Dining')
    expect(html).toContain('Weekly Expense Spike')
    expect(html).toContain('vs Previous Week')
  })

  it('2. renders zero-data weekly payload safely without NaN or Infinity', () => {
    const payload = createBaseWeeklyPayload()
    payload.summary = {
      totalIncome: 0,
      totalExpenses: 0,
      netSavings: 0,
      savingsRate: 0,
    }
    payload.categories = []
    payload.topCategory = undefined
    payload.insights = []

    const html = renderWeeklyEmail(payload)

    expect(html).not.toContain('NaN')
    expect(html).not.toContain('Infinity')
    expect(html).not.toContain('undefined')
    expect(html).toContain('No expense transactions recorded for this period.')
    expect(html).toContain('Your account had no urgent financial warnings')
  })

  it('3. handles missing optional comparison gracefully (N/A text)', () => {
    const payload = createBaseWeeklyPayload()
    payload.summary.previousPeriodExpenses = undefined
    payload.summary.expensePercentChange = undefined

    const html = renderWeeklyEmail(payload)

    expect(html).toContain('vs Previous Week')
    expect(html).toContain('N/A')
  })

  it('4. hides top category section completely when topCategory is undefined', () => {
    const payload = createBaseWeeklyPayload()
    payload.topCategory = undefined

    const html = renderWeeklyEmail(payload)

    expect(html).not.toContain('Top Expense Category')
  })

  it('5. renders clean empty state when categories array is empty', () => {
    const payload = createBaseWeeklyPayload()
    payload.categories = []

    const html = renderWeeklyEmail(payload)

    expect(html).toContain('No expense transactions recorded for this period.')
  })

  it('6. renders neutral message when insights array is empty', () => {
    const payload = createBaseWeeklyPayload()
    payload.insights = []

    const html = renderWeeklyEmail(payload)

    expect(html).toContain('Your account had no urgent financial warnings or spending spikes this period.')
  })

  it('7. neutralizes malicious user-controlled strings via HTML escaping', () => {
    const payload = createBaseWeeklyPayload()
    payload.user.displayName = '<script>alert("xss")</script>'
    payload.categories[0].categoryName = '<img src=x onerror=alert(1)>'
    payload.insights[0].title = '<svg onload=alert(1)>'

    const html = renderWeeklyEmail(payload)

    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img src=x onerror=alert(1)>')
    expect(html).not.toContain('<svg onload=alert(1)>')
    expect(html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).toContain('&lt;svg onload=alert(1)&gt;')
  })

  it('8. renders negative cash flow payload correctly with red savings indicator', () => {
    const payload = createBaseWeeklyPayload()
    payload.summary = {
      totalIncome: 10000,
      totalExpenses: 25000,
      netSavings: -15000,
      savingsRate: 0,
    }

    const html = renderWeeklyEmail(payload)

    expect(html).toContain('-₹15,000')
    expect(html).toContain('color: #ef4444')
  })

  it('9. preserves input payload immutability', () => {
    const payload = createBaseWeeklyPayload()
    const frozenPayload = Object.freeze(JSON.parse(JSON.stringify(payload)))

    expect(() => renderWeeklyEmail(frozenPayload)).not.toThrow()
  })

  it('10. produces 100% deterministic output', () => {
    const payload = createBaseWeeklyPayload()
    const html1 = renderWeeklyEmail(payload)
    const html2 = renderWeeklyEmail(payload)

    expect(html1).toBe(html2)
  })
})
