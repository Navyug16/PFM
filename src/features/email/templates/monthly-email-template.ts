/**
 * PFM M14 Phase 3.5.2 — Monthly Email Template Renderer
 * Transforms a read-only EmailReportPayload into email-safe HTML for monthly dispatches.
 */

import type { EmailReportPayload } from '../types/email'
import { renderEmailLayout } from './email-layout'
import {
  renderFinancialSummaryGrid,
  renderTopCategorySection,
  renderCategorySpendingTable,
  renderInsightsSection,
} from './email-components'

/**
 * Pure, deterministic monthly email HTML renderer.
 * 
 * STRICT RULES:
 * 1. Performs ZERO financial arithmetic or insight generation.
 * 2. Consumes read-only EmailReportPayload.
 * 3. Does NOT access window, document, or browser DOM APIs.
 * 4. Produces email-safe HTML string.
 */
export const renderMonthlyEmail = (payload: EmailReportPayload): string => {
  const { user, period, summary, categories, topCategory, insights } = payload

  const summaryHtml = renderFinancialSummaryGrid(
    summary,
    user.currency,
    user.locale,
    'vs Previous Month'
  )

  const topCategoryHtml = renderTopCategorySection(
    topCategory,
    user.currency,
    user.locale
  )

  const categoriesHtml = renderCategorySpendingTable(
    categories,
    user.currency,
    user.locale
  )

  const insightsHtml = renderInsightsSection(insights)

  const contentHtml = `
${summaryHtml}
${topCategoryHtml}
${categoriesHtml}
${insightsHtml}`

  return renderEmailLayout({
    title: 'Monthly Financial Report',
    subtitle: 'Your full-month financial performance deep-dive',
    badgeText: 'Monthly Report',
    user,
    period,
    contentHtml,
  })
}
