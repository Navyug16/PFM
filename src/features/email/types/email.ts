import type { CurrencyOption, LocaleOption, DateFormatOption } from '@/features/settings/types'

/**
 * PFM M14 Phase 3.2 — Trusted Email Data Contract (Refined)
 * 
 * TRUST BOUNDARY DOCUMENTATION:
 * -----------------------------
 * This module defines the strict, read-only TypeScript domain contract that email payload
 * builders (Phases 3.3 & 3.4) produce and future email templates consume.
 * 
 * CRITICAL RULES:
 * 1. This payload is a READ-ONLY representation of already-calculated financial facts.
 * 2. It MUST NOT perform financial math, arithmetic, or insight generation itself.
 * 3. All financial metrics MUST originate from trusted calculation engines:
 *    - @/features/financial/utils/calculations.ts
 *    - @/features/financial/utils/date-utils.ts
 *    - @/features/insights/utils/report-calculations.ts
 *    - @/features/insights/utils/report-insight-engine.ts
 * 4. Contains NO security credentials, auth tokens, passwords, or service-role keys.
 * 5. Contains NO AI/LLM predictions, forecasts, or unverified calculation models.
 */

/**
 * Finite union of supported report types.
 * Single source of truth: EmailReportPayload owns reportType.
 */
export type EmailReportType = 'weekly' | 'monthly'

/**
 * Minimum trusted user context required for email formatting and localized presentation.
 */
export interface EmailUserContext {
  displayName: string
  currency: CurrencyOption
  locale: LocaleOption
  dateFormat: DateFormatOption
}

/**
 * Period structure for report dispatches.
 * Contains only date range information (reportType is owned exclusively by EmailReportPayload).
 */
export interface EmailReportPeriod {
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  formattedRange: string // e.g. "Sep 07, 2026 – Sep 13, 2026"
}

/**
 * High-level financial period summary figures derived from the calculation engine.
 */
export interface EmailFinancialSummary {
  totalIncome: number
  totalExpenses: number
  netSavings: number
  savingsRate: number
  previousPeriodExpenses?: number
  expensePercentChange?: number
}

/**
 * Directional trend indicator matching M13 CategoryBreakdownDetail direction.
 */
export type CategorySpendingDirection = 'up' | 'down' | 'unchanged' | 'unavailable'

/**
 * Category-wise spending item structure.
 * 
 * SEMANTIC MEANING OF `percentage`:
 * Represents the category's percentage share of total period expenses,
 * calculated as: (categoryAmount / totalPeriodExpenses) * 100.
 */
export interface EmailCategorySpendingItem {
  categoryId: string
  categoryName: string
  amount: number
  percentage: number // Percentage share (%) of total period expenses
  transactionCount?: number
  direction?: CategorySpendingDirection
}

/**
 * Finite union matching actual verified M13 deterministic insight types.
 */
export type EmailInsightType =
  | 'negative_cash_flow'
  | 'spending_increase'
  | 'spending_decrease'
  | 'budget_exceeded'
  | 'budget_warning'
  | 'goal_behind'
  | 'spending_spike'
  | 'savings_rate_alert'
  | 'savings_improvement'
  | 'category_concentration'
  | 'recurring_commitments'
  | 'largest_expense'

/**
 * Deterministic financial insight structure originating strictly from M13 insight rules.
 */
export interface EmailInsightItem {
  id: string
  type: EmailInsightType
  title: string
  statement: string
  severity: 'positive' | 'neutral' | 'review' | 'important'
}

/**
 * Master Mandatory Trusted Email Report Payload Contract.
 * Strict core contract containing ONLY verified core report sections.
 */
export interface EmailReportPayload {
  reportType: EmailReportType
  generatedAt: string // ISO 8601 Timestamp
  user: EmailUserContext
  period: EmailReportPeriod
  summary: EmailFinancialSummary
  categories: EmailCategorySpendingItem[]
  topCategory?: EmailCategorySpendingItem
  insights: EmailInsightItem[]
}

/**
 * Reserved Extension Contract: Optional non-core sections (Monthly dispatches only).
 * NOT part of the mandatory EmailReportPayload core contract.
 * Must NOT be populated by builders unless the underlying calculation is explicitly verified.
 */
export interface EmailOptionalReportExtensions {
  budget?: {
    totalLimit: number
    totalSpent: number
    overallPercentage: number
  }
  goals?: {
    activeGoalsCount: number
    onTrackCount: number
    behindCount: number
  }
  recurring?: {
    totalMonthlyCommitments: number
    recurringRatio: number
  }
}
