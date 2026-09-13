/**
 * PFM M14 Phase 3.5.2 — Reusable Email Components
 * Pure presentation components converting payload sections into email-safe HTML strings.
 */

import { escapeHtml } from './html-escaper'
import { formatCurrency, formatPercentage } from '@/features/financial/utils/formatters'
import type {
  EmailFinancialSummary,
  EmailCategorySpendingItem,
  EmailInsightItem,
} from '../types/email'

/**
 * 1. Financial Summary Grid Component
 */
export const renderFinancialSummaryGrid = (
  summary: EmailFinancialSummary,
  currency: string,
  locale: string,
  comparisonLabel: string
): string => {
  const formattedIncome = formatCurrency(summary.totalIncome, currency, locale)
  const formattedExpenses = formatCurrency(summary.totalExpenses, currency, locale)
  const formattedSavings = formatCurrency(summary.netSavings, currency, locale)
  const formattedSavingsRate = formatPercentage(summary.savingsRate)

  // Present trusted comparison values directly without calculating arithmetic
  let comparisonText = 'N/A'
  if (
    summary.previousPeriodExpenses !== undefined &&
    summary.expensePercentChange !== undefined
  ) {
    const changeVal = summary.expensePercentChange
    const formattedPrevExpenses = formatCurrency(summary.previousPeriodExpenses, currency, locale)
    const sign = changeVal > 0 ? '+' : ''
    comparisonText = `${sign}${changeVal.toFixed(1)}% vs previous period (${formattedPrevExpenses})`
  }

  const isPositiveSavings = summary.netSavings >= 0
  const savingsColor = isPositiveSavings ? '#10b981' : '#ef4444'

  return `
<!-- Financial Summary Grid -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
  <tr>
    <td width="50%" style="padding-right: 6px; padding-bottom: 12px; vertical-align: top;">
      <div style="background-color: #1a1a22; padding: 16px; border-radius: 8px; border: 1px solid #272732;">
        <span style="font-size: 12px; font-weight: 500; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Total Income</span>
        <span style="font-size: 20px; font-weight: 700; color: #10b981; display: block;">${formattedIncome}</span>
      </div>
    </td>
    <td width="50%" style="padding-left: 6px; padding-bottom: 12px; vertical-align: top;">
      <div style="background-color: #1a1a22; padding: 16px; border-radius: 8px; border: 1px solid #272732;">
        <span style="font-size: 12px; font-weight: 500; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Total Expenses</span>
        <span style="font-size: 20px; font-weight: 700; color: #ef4444; display: block;">${formattedExpenses}</span>
      </div>
    </td>
  </tr>
  <tr>
    <td width="50%" style="padding-right: 6px; vertical-align: top;">
      <div style="background-color: #1a1a22; padding: 16px; border-radius: 8px; border: 1px solid #272732;">
        <span style="font-size: 12px; font-weight: 500; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Net Savings</span>
        <span style="font-size: 20px; font-weight: 700; color: ${savingsColor}; display: block;">${formattedSavings}</span>
      </div>
    </td>
    <td width="50%" style="padding-left: 6px; vertical-align: top;">
      <div style="background-color: #1a1a22; padding: 16px; border-radius: 8px; border: 1px solid #272732;">
        <span style="font-size: 12px; font-weight: 500; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Savings Rate</span>
        <span style="font-size: 20px; font-weight: 700; color: #f8fafc; display: block;">${formattedSavingsRate}</span>
      </div>
    </td>
  </tr>
  <tr>
    <td colspan="2" style="padding-top: 12px;">
      <div style="background-color: #1a1a22; padding: 12px 16px; border-radius: 8px; border: 1px solid #272732;">
        <span style="font-size: 12px; color: #9ca3af;">
          <strong style="color: #f8fafc;">${escapeHtml(comparisonLabel)}:</strong> ${escapeHtml(comparisonText)}
        </span>
      </div>
    </td>
  </tr>
</table>`
}

/**
 * 2. Top Category Spotlight Component
 */
export const renderTopCategorySection = (
  topCategory: EmailCategorySpendingItem | undefined,
  currency: string,
  locale: string
): string => {
  if (!topCategory) return ''

  const safeCategoryName = escapeHtml(topCategory.categoryName)
  const formattedAmount = formatCurrency(topCategory.amount, currency, locale)
  const formattedShare = formatPercentage(topCategory.percentage)

  return `
<!-- Top Category Spotlight -->
<div style="background-color: rgba(234, 88, 12, 0.08); border: 1px solid rgba(234, 88, 12, 0.3); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
  <span style="font-size: 11px; font-weight: 700; color: #ea580c; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Top Expense Category</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td>
        <span style="font-size: 16px; font-weight: 700; color: #f8fafc;">${safeCategoryName}</span>
      </td>
      <td align="right">
        <span style="font-size: 16px; font-weight: 700; color: #ea580c;">${formattedAmount}</span>
        <span style="font-size: 12px; color: #9ca3af; margin-left: 6px;">(${formattedShare})</span>
      </td>
    </tr>
  </table>
</div>`
}

/**
 * 3. Category Spending Breakdown Table Component
 */
export const renderCategorySpendingTable = (
  categories: EmailCategorySpendingItem[],
  currency: string,
  locale: string
): string => {
  if (categories.length === 0) {
    return `
<!-- Category Breakdown Empty State -->
<div style="background-color: #1a1a22; border: 1px solid #272732; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
  <p style="margin: 0; font-size: 14px; color: #9ca3af;">No expense transactions recorded for this period.</p>
</div>`
  }

  const rowsHtml = categories
    .map((cat) => {
      const safeName = escapeHtml(cat.categoryName)
      const formattedAmount = formatCurrency(cat.amount, currency, locale)
      const formattedPercent = formatPercentage(cat.percentage)
      const countText = cat.transactionCount !== undefined ? ` (${cat.transactionCount} tx)` : ''

      return `
    <tr style="border-bottom: 1px solid #272732;">
      <td style="padding: 10px 12px; font-size: 14px; color: #f8fafc; font-weight: 500;">
        ${safeName}<span style="font-size: 12px; color: #575765;">${countText}</span>
      </td>
      <td align="right" style="padding: 10px 12px; font-size: 14px; color: #f8fafc; font-weight: 600;">
        ${formattedAmount}
      </td>
      <td align="right" style="padding: 10px 12px; font-size: 14px; color: #9ca3af;">
        ${formattedPercent}
      </td>
    </tr>`
    })
    .join('')

  return `
<!-- Category Breakdown Table -->
<div style="margin-bottom: 24px;">
  <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #f8fafc;">Category Breakdown</h3>
  <div style="background-color: #1a1a22; border: 1px solid #272732; border-radius: 8px; overflow: hidden;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
      <thead>
        <tr style="background-color: #272732; border-bottom: 1px solid #272732;">
          <th align="left" style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Category</th>
          <th align="right" style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Amount</th>
          <th align="right" style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Share</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>
</div>`
}

/**
 * 4. Deterministic Insights Section Component
 */
export const renderInsightsSection = (insights: EmailInsightItem[]): string => {
  if (insights.length === 0) {
    return `
<!-- Insights Neutral State -->
<div style="margin-bottom: 24px;">
  <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #f8fafc;">Financial Insights</h3>
  <div style="background-color: #1a1a22; border: 1px solid #272732; border-radius: 8px; padding: 16px;">
    <p style="margin: 0; font-size: 14px; color: #9ca3af;">Your account had no urgent financial warnings or spending spikes this period.</p>
  </div>
</div>`
  }

  const itemsHtml = insights
    .map((insight) => {
      const safeTitle = escapeHtml(insight.title)
      const safeStatement = escapeHtml(insight.statement)

      let borderColor = '#272732'
      let titleColor = '#f8fafc'
      let bgColor = '#1a1a22'

      if (insight.severity === 'positive') {
        borderColor = 'rgba(16, 185, 129, 0.4)'
        titleColor = '#10b981'
        bgColor = 'rgba(16, 185, 129, 0.08)'
      } else if (insight.severity === 'review' || insight.severity === 'important') {
        borderColor = 'rgba(239, 68, 68, 0.4)'
        titleColor = '#ef4444'
        bgColor = 'rgba(239, 68, 68, 0.08)'
      }

      return `
    <div style="background-color: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 8px; padding: 14px 16px; margin-bottom: 10px;">
      <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: ${titleColor};">${safeTitle}</h4>
      <p style="margin: 0; font-size: 13px; color: #9ca3af; line-height: 1.4;">${safeStatement}</p>
    </div>`
    })
    .join('')

  return `
<!-- Insights Section -->
<div style="margin-bottom: 24px;">
  <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #f8fafc;">Financial Insights</h3>
  ${itemsHtml}
</div>`
}
