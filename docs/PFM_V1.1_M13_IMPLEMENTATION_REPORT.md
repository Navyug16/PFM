# PFM V1.1 — Milestone 13 Implementation Report: Insights, Questions & Export

**Project**: Personal Finance Manager (PFM)  
**Milestone**: M13 — Insights, Questions & Export  
**Date**: September 8, 2026  
**Status**: Completed & Verified  

---

## 1. Executive Summary

Milestone 13 enhances PFM's financial understanding, trend visibility, period comparison accuracy, rule-based insight generation, and browser-local data export without introducing AI/LLMs or secondary calculation engines.

All financial metrics and question answers draw directly from the existing trusted calculation layer ([`calculations.ts`](file:///e:/PFM/src/features/financial/utils/calculations.ts) and [`date-utils.ts`](file:///e:/PFM/src/features/financial/utils/date-utils.ts)). Zero financial formulas were duplicated in engine parsers or React components.

---

## 2. Files Modified & Created

### New Files Created:
1. [`src/features/insights/utils/question-engine.ts`](file:///e:/PFM/src/features/insights/utils/question-engine.ts)
   - Contains deterministic parser, category matcher, period precedence resolver, 14 intent execution mapping, and structured `QuestionResult` formatting.
2. [`src/features/insights/utils/question-engine.test.ts`](file:///e:/PFM/src/features/insights/utils/question-engine.test.ts)
   - 25 unit tests covering all 14 supported intents, category matching, period precedence, unsupported query fallbacks, and zero-data edge cases.
3. [`src/features/insights/components/FinancialQuestions.tsx`](file:///e:/PFM/src/features/insights/components/FinancialQuestions.tsx)
   - Financial Question UI offering suggested query chips, input search bar, and structured metric result cards.
4. [`src/features/insights/components/ExportButton.tsx`](file:///e:/PFM/src/features/insights/components/ExportButton.tsx)
   - Sleek dropdown menu component providing immediate browser-local CSV export for Transaction Ledger, Account Balances, Category Outlays, and Savings Goals Progress.

### Modified Files:
1. [`src/features/insights/components/CashFlowTrend.tsx`](file:///e:/PFM/src/features/insights/components/CashFlowTrend.tsx)
   - Converted "Income vs Expenses Trend" into a clean side-by-side vertical bar chart comparing Income (Emerald) vs Expenses (Rose) for each interval with hover tooltips and responsive styling.
2. [`src/features/insights/components/PeriodSelector.tsx`](file:///e:/PFM/src/features/insights/components/PeriodSelector.tsx)
   - Embedded top-level `ExportButton` dropdown right alongside analysis period dropdown controls.
3. [`src/features/insights/InsightsPage.tsx`](file:///e:/PFM/src/features/insights/InsightsPage.tsx)
   - Integrated `FinancialQuestions` component and top `ExportButton`; removed bottom `ExportPanel` container.

---

## 3. Supported 14 Question Intents & Trusted Function Mapping

| Intent ID | Description | Query Example | Trusted Calculation Function |
|---|---|---|---|
| `total_income` | Period income total | "How much did I earn this period?" | `calculatePeriodIncome` |
| `total_expenses` | Period expense total | "How much did I spend this period?" | `calculatePeriodExpenses` |
| `period_savings` | Net period savings | "How much did I save this month?" | `calculatePeriodSavings` |
| `savings_rate` | Period savings rate | "What is my savings rate?" | `calculateSavingsRate` |
| `available_balance` | Sum of liquid accounts | "What is my available balance?" | `calculateAvailableBalance` |
| `account_balance` | Sum of active balances | "What is my account balance?" | `getSingleCurrencyNetPosition` |
| `net_position` | Cumulative net position | "What is my net financial position?" | `getSingleCurrencyNetPosition` |
| `category_spending` | Category expense total | "How much did I spend on Food & Dining?" | `calculateCategorySpending` |
| `largest_spending_category` | Category with max outlays | "What was my largest spending category?" | `identifyLargestExpenseCategory` |
| `income_vs_expenses` | Net cash flow breakdown | "What is my income vs expenses breakdown?" | `calculatePeriodIncome` & `calculatePeriodExpenses` |
| `period_expense_comparison` | Expense growth vs prev period | "How do my expenses compare to last month?" | `calculatePeriodExpenses` & `calculatePeriodComparison` |
| `period_income_comparison` | Income growth vs prev period | "How does my income compare to last period?" | `calculatePeriodIncome` & `calculatePeriodComparison` |
| `savings_comparison` | Savings diff vs prev period | "How do my savings compare to last period?" | `calculatePeriodSavings` |
| `transaction_count` | Count of period transactions | "How many transactions were logged?" | `transactions.filter(...)` date length |

---

## 4. Deferred Questions & Reasons

The following categories of questions were explicitly classified as `unsupported` / `deferred`:
- **Predictive queries**: "How much will I spend next month?", "Forecast my budget for 2027"
- **Subjective / Financial Advice**: "Should I buy a new phone?", "How should I invest my money?"
- **Tax Optimization**: "How can I optimize my tax returns?"
- **Unsupported Period Ranges**: "What was my balance 5 years ago?", "What will be my income next year?"

*Reason*: These capabilities belong to M15 (Local AI / LLM layer) or require predictive modeling unavailable in M13.

---

## 5. Question Parsing, Category Matching & Period Precedence Rules

### Period Precedence Rules:
1. **Explicit Period Phrase in Query**: Explicit terms (`this week`, `this month`, `last month`, `last 3 months`, `last 6 months`, `this calendar year`, `financial year`) resolve start/end dates via `getReportPeriodBounds`.
2. **Implicit Period**: When no period phrase is detected, query falls back to the user's currently active Insights period preset.
3. **Ambiguous / Unsupported Period**: Returns `unsupported` status without guessing.

### Category Matching Rules:
- Case-insensitive matching against user's actual `Category[]`.
- Whitespace and punctuation normalized.
- Exact category name matched with highest priority.
- No invented or hardcoded global category databases.

---

## 6. Deterministic Insight Rules Table

| Insight ID | Title | Trigger Condition | Formula / Calculation | Rationale / Resulting Output |
|---|---|---|---|---|
| `insight-negative-cash-flow` | Net Cash Flow Deficit | `savings < 0` | `calculatePeriodSavings` | "Expenses exceeded income by [amount]." |
| `insight-spending-increase` | High Spending Growth | `prevExpenses > 0` & `pct > 15%` | `calculatePeriodExpenses` & `calculatePeriodComparison` | "Spending is up by [amount] (+[X]%) vs previous period." |
| `insight-spending-decrease` | Spending Reduction | `prevExpenses > 0` & `pct < -10%` | `calculatePeriodExpenses` & `calculatePeriodComparison` | "You spent [amount] less (-[X]%) than last period." |
| `insight-savings-rate-alert` | Low Savings Rate Alert | `savingsRate < 10%` & `income > 0` & `savings >= 0` | `calculateSavingsRate` | "Your savings rate is only [X]% for this period." |
| `insight-savings-improvement` | Savings Improvement | `prevSavings > 0` & `savings > prevSavings` | `calculatePeriodSavings` | "You saved [amount] more than previous period." |
| `insight-category-concentration` | Heavy Spending Concentration | Top category > 35% of outlays | `calculateCategorySpending` & `calculateCategoryShare` | "[Category] represents [X]% of total outlays." |

---

## 7. Local Export Center & Privacy Verification

- **Reused CSV Generators**: Reused `exportTransactionsToCSV`, `exportAccountSummaryToCSV`, `exportCategorySpendingToCSV`, and `exportGoalProgressToCSV` in [`src/features/insights/utils/csv-export.ts`](file:///e:/PFM/src/features/insights/utils/csv-export.ts).
- **Top Export Button Component**: Positioned compactly next to period controls via [`ExportButton.tsx`](file:///e:/PFM/src/features/insights/components/ExportButton.tsx).
- **Client-Side Generation**: CSV files are compiled in browser RAM and downloaded using standard `Blob` and `URL.createObjectURL`.
- **Privacy & Security Audit**:
  - **Zero Third-Party Calls**: Financial data is never transmitted to external APIs, analytics endpoints, or AI models.
  - **RLS Preserved**: Data access strictly honors the authenticated Supabase session.
  - **No Privileged Endpoints**: No `service_role` credentials exist in client code.

---

## 8. Zero-Data & Edge Case Handling

- **Zero Baseline Comparisons**: If previous period income or expense is ₹0, percentage growth displays as `"Baseline Unavailable"` rather than generating division-by-zero artifacts like `NaN%` or `Infinity%`.
- **Zero Income**: If income is ₹0, savings rate cleanly evaluates to `0.0%` without errors.
- **No Categories / Transactions**: Unused category queries safely return `₹0.00` or `"No category expenses recorded for this period."`

---

## 9. Mobile QA (375px, 390px, 430px)

- Tested viewports: **375px (iPhone SE)**, **390px (iPhone 13/14)**, **430px (iPhone Pro Max)**.
- **Horizontal Overflow**: **0px** (no horizontal scrollbars).
- **Touch Targets**: All suggested question chips, export buttons, and input controls maintain minimum **44px** touch height.

---

## 10. Accessibility QA

- **Keyboard Navigation**: Full tab ordering across period dropdowns, export action buttons, question chips, and text inputs.
- **Focus Highlights**: Visible focus rings (`focus:ring-2 focus:ring-brand-orange`) on all interactive controls.
- **Screen Reader Announcements**: `aria-live="polite"` attributes configured on `FinancialQuestions` result containers.

---

## 11. Automated Test Results

Ran `npm run test` (Vitest):
```
 RUN  v4.1.9 E:/PFM

 ✓ src/features/transactions/utils/recurrence-math.test.ts (8 tests)
 ✓ src/features/transactions/utils/quality-engine.test.ts (6 tests)
 ✓ src/features/settings/utils/settings-validation.test.ts (10 tests)
 ✓ src/features/budgets/utils/budget-calculations.test.ts (15 tests)
 ✓ src/features/insights/utils/csv-export.test.ts (5 tests)
 ✓ src/features/financial/utils/calculations.test.ts (42 tests)
 ✓ src/features/transactions/utils/duplicate-engine.test.ts (3 tests)
 ✓ src/features/insights/utils/report-calculations.test.ts (7 tests)
 ✓ src/features/financial/utils/formatters.test.ts (12 tests)
 ✓ src/features/insights/utils/question-engine.test.ts (25 tests)

 Test Files  10 passed (10)
      Tests  133 passed (133)
```

Ran `npm run typecheck`:
`tsc --noEmit` exited with code 0.

Ran `npm run lint`:
`eslint src --max-warnings 0` exited with code 0.

Ran `npm run build`:
Vite production build succeeded cleanly with 0 errors.

---

## 12. M12 Regression Verification

- **Transactions Page (`TransactionsPage.tsx`)**: Baseline intact; no changes made.
- **Transaction Form (`TransactionForm.tsx`)**: Baseline intact; no changes made.
- **Recurring Page (`RecurringPage.tsx`)**: Baseline intact; RPCs and backend logic unchanged.
- **Daily Check-In Modal (`DailyCheckInModal.tsx`)**: Baseline intact; no changes made.

---

## 13. Limitations

- Complex natural language sentence variations outside the 14 defined intents (e.g. conversational chit-chat) cleanly fall back to `unsupported` status.
- Predictive forecasting and tax guidance remain deferred to M15 (AI/Local Agent milestone).

---

## 14. Git Status & Scope Audit

Per strict execution rules:
- **No `git commit` was executed.**
- **No `git push` was executed.**
- All modified and newly created files remain staged / available in working directory for manual developer review.
