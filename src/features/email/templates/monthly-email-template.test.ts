import { describe, it, expect } from 'vitest'
import { renderMonthlyEmail } from './monthly-email-template'
import type { EmailReportPayload } from '../types/email'

describe('renderMonthlyEmail Template Renderer', () => {
  const createBaseMonthlyPayload = (): EmailReportPayload => ({
    reportType: 'monthly',
    generatedAt: '2026-09-01T00:00:00.000Z',
    user: {
      displayName: 'Samantha Reed',
      currency: 'INR',
      locale: 'en-IN',
      dateFormat: 'YYYY-MM-DD',
    },
    period: {
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      formattedRange: 'Aug 01, 2026 – Aug 31, 2026',
    },
    summary: {
      totalIncome: 200000,
      totalExpenses: 120000,
      netSavings: 80000,
      savingsRate: 40,
      previousPeriodExpenses: 110000,
      expensePercentChange: 9.1,
    },
    categories: [
      {
        categoryId: 'cat-housing',
        categoryName: 'Rent & Utilities',
        amount: 50000,
        percentage: 41.7,
        transactionCount: 4,
        direction: 'unchanged',
      },
      {
        categoryId: 'cat-shopping',
        categoryName: 'Shopping & Leisure',
        amount: 35000,
        percentage: 29.2,
        transactionCount: 12,
        direction: 'up',
      },
    ],
    topCategory: {
      categoryId: 'cat-housing',
      categoryName: 'Rent & Utilities',
      amount: 50000,
      percentage: 41.7,
      transactionCount: 4,
      direction: 'unchanged',
    },
    insights: [
      {
        id: 'ins-m1',
        type: 'savings_improvement',
        title: 'Strong Monthly Savings',
        statement: 'You achieved a 40% net savings rate this month.',
        severity: 'positive',
      },
    ],
  })

  it('1. renders normal monthly email with valid HTML structure and metrics', () => {
    const payload = createBaseMonthlyPayload()
    const html = renderMonthlyEmail(payload)

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('Monthly Financial Report')
    expect(html).toContain('Hi Samantha Reed')
    expect(html).toContain('Aug 01, 2026 – Aug 31, 2026')
    expect(html).toContain('Rent &amp; Utilities')
    expect(html).toContain('Shopping &amp; Leisure')
    expect(html).toContain('Strong Monthly Savings')
    expect(html).toContain('vs Previous Month')
  })

  it('2. renders zero-data monthly payload safely without NaN or Infinity', () => {
    const payload = createBaseMonthlyPayload()
    payload.summary = {
      totalIncome: 0,
      totalExpenses: 0,
      netSavings: 0,
      savingsRate: 0,
    }
    payload.categories = []
    payload.topCategory = undefined
    payload.insights = []

    const html = renderMonthlyEmail(payload)

    expect(html).not.toContain('NaN')
    expect(html).not.toContain('Infinity')
    expect(html).not.toContain('undefined')
    expect(html).toContain('No expense transactions recorded for this period.')
    expect(html).toContain('Your account had no urgent financial warnings')
  })

  it('3. handles missing optional comparison gracefully (N/A text)', () => {
    const payload = createBaseMonthlyPayload()
    payload.summary.previousPeriodExpenses = undefined
    payload.summary.expensePercentChange = undefined

    const html = renderMonthlyEmail(payload)

    expect(html).toContain('vs Previous Month')
    expect(html).toContain('N/A')
  })

  it('4. hides top category section completely when topCategory is undefined', () => {
    const payload = createBaseMonthlyPayload()
    payload.topCategory = undefined

    const html = renderMonthlyEmail(payload)

    expect(html).not.toContain('Top Expense Category')
  })

  it('5. renders clean empty state when categories array is empty', () => {
    const payload = createBaseMonthlyPayload()
    payload.categories = []

    const html = renderMonthlyEmail(payload)

    expect(html).toContain('No expense transactions recorded for this period.')
  })

  it('6. renders neutral message when insights array is empty', () => {
    const payload = createBaseMonthlyPayload()
    payload.insights = []

    const html = renderMonthlyEmail(payload)

    expect(html).toContain('Your account had no urgent financial warnings or spending spikes this period.')
  })

  it('7. neutralizes malicious user-controlled strings via HTML escaping', () => {
    const payload = createBaseMonthlyPayload()
    payload.user.displayName = '<script>alert("xss")</script>'
    payload.categories[0].categoryName = '<img src=x onerror=alert(1)>'
    payload.insights[0].title = '<svg onload=alert(1)>'

    const html = renderMonthlyEmail(payload)

    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img src=x onerror=alert(1)>')
    expect(html).not.toContain('<svg onload=alert(1)>')
    expect(html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).toContain('&lt;svg onload=alert(1)&gt;')
  })

  it('8. renders negative cash flow payload correctly with red savings indicator', () => {
    const payload = createBaseMonthlyPayload()
    payload.summary = {
      totalIncome: 40000,
      totalExpenses: 90000,
      netSavings: -50000,
      savingsRate: 0,
    }

    const html = renderMonthlyEmail(payload)

    expect(html).toContain('-₹50,000')
    expect(html).toContain('color: #ef4444')
  })

  it('9. preserves input payload immutability', () => {
    const payload = createBaseMonthlyPayload()
    const frozenPayload = Object.freeze(JSON.parse(JSON.stringify(payload)))

    expect(() => renderMonthlyEmail(frozenPayload)).not.toThrow()
  })

  it('10. produces 100% deterministic output', () => {
    const payload = createBaseMonthlyPayload()
    const html1 = renderMonthlyEmail(payload)
    const html2 = renderMonthlyEmail(payload)

    expect(html1).toBe(html2)
  })
})
