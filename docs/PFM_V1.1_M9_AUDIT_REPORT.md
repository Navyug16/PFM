# PFM V1.1 — M9 Repository & Architecture Audit

**Project**: Personal Finance Manager (PFM)  
**Version**: V1.1  
**Milestone**: M9 — Repository & Architecture Audit  
**Date**: 2026-09-05  
**Status**: Audit Complete / No Code or Schema Modified  

---

## 1. Executive Summary

This document presents the technical architecture audit for **Personal Finance Manager (PFM) V1.1**, strictly mapped against the product requirements, UX vision, financial calculation rules, and milestone roadmap defined in `PFM_V1.1_MASTER_PLAN.md`.

### Core Audit Key Findings
1. **Existing V1 Foundation is Robust**: V1 possesses a clean feature architecture, strong Supabase PostgreSQL schema with Row-Level Security (RLS) policies on all tables, hardened `SECURITY DEFINER` RPCs, and a centralized financial calculation engine with 108 passing unit tests.
2. **Zero Financial Logic Rewrites**: Core financial math (`src/features/financial/utils/calculations.ts`) uses cent-based integer summation (`sumCents`) to eliminate IEEE-754 floating-point drift. V1.1 will consume this engine as the **single source of truth** without duplicating financial logic.
3. **Theme Bug Root Cause Identified**: `src/styles/globals.css` uses Tailwind CSS v4 `@theme` block with static hex color variables attached to `:root`. Toggling light mode adds/removes the `.dark` class on `<html>`, but CSS variables remain static dark hex values. Defining scoped CSS variables for `:root` and `.dark` resolves theme toggling cleanly.
4. **Navigation Cramming Root Cause Identified**: `AppShell.tsx` currently renders 9 top-level links on desktop and attempts to squeeze all 9 into a `grid-cols-7` mobile bottom bar. Restructuring navigation into 4 primary hubs (**Home**, **Transactions**, **Planning**, **Insights**) solves both mobile overflow and desktop complexity.
5. **No Existing Email or AI Code**: No email dispatch infrastructure or AI/LLM integrations currently exist in the codebase. Clear contracts and clean modular architectures are designed in this report for Track B (AI Question Framework) and Email Notification System.

---

## 2. Current V1 Architecture

### 2.1 Technology Stack & Build Tools
- **Build System**: Vite 8.1.1 + React 19.2.7 + TypeScript 6.0.2.
- **Styling**: Tailwind CSS 4.3.2 with `@tailwindcss/vite` plugin.
- **Routing**: React Router DOM 7.18.1 (`createBrowserRouter` in `src/app/router.tsx`).
- **Icons**: Lucide React 1.23.0.
- **Backend / Database**: Supabase JS Client 2.110.0 with PostgreSQL 15+, Row-Level Security (RLS), and custom PL/pgSQL RPC functions.
- **Test Framework**: Vitest 4.1.9 (9 test suites, 108 unit tests, 100% passing).

### 2.2 Repository Directory Mapping
```
e:\PFM
├── .agents/                    # Workspace agent rules & custom preferences
├── docs/                       # Project documentation & Master Plan
│   ├── PFM_V1.1_MASTER_PLAN.md # V1.1 Product Source of Truth
│   └── PFM_V1.1_M9_AUDIT_REPORT.md # This Audit Report
├── src/
│   ├── app/                    # Entry point & App router setup (router.tsx, App.tsx)
│   ├── components/             # Reusable UI & Layout (AppShell.tsx, PageContainer.tsx, etc.)
│   ├── config/                 # Application global config (app-config.ts)
│   ├── features/               # Domain-driven feature modules
│   │   ├── accounts/           # Account management & balances
│   │   ├── auth/               # Supabase Authentication & Route Protection
│   │   ├── budgets/            # Monthly budget allocations & safe-to-spend math
│   │   ├── financial/          # Central calculation engine, date utils, formatters
│   │   ├── goals/              # Financial goals & progress tracking
│   │   ├── insights/           # Reports, cash flow trends, local CSV export
│   │   ├── metals/             # Gold & Silver commodity asset tracking
│   │   ├── overview/           # Dashboard page, greeting, summary cards
│   │   ├── settings/           # User profile & theme settings context
│   │   └── transactions/       # Transactions, tags, quality/duplicate engines, recurring rules
│   ├── hooks/                  # Global hooks
│   ├── lib/                    # Supabase client initialization (supabase.ts)
│   ├── main.tsx                # Application root mounting & service worker script
│   └── styles/                 # Tailwind CSS v4 design tokens (globals.css)
└── supabase/                   # Database migrations, RLS policies, RPC triggers
    └── migrations/
        ├── 20260704000001_financial_foundation.sql
        ├── 20260704000002_default_categories.sql
        ├── 20260706000001_budgets.sql
        ├── 20260707000001_recurring_transactions.sql
        ├── 20260710000001_profiles_preferences.sql
        └── 20260710000002_profiles_insert_policy.sql
```

---

## 3. V1.1 Requirement Mapping

The table below maps every requirement from `PFM_V1.1_MASTER_PLAN.md` to the V1 codebase:

| V1.1 Requirement | Current Code Location | Reusable | Modify | New | Backend / DB | Technical Risk |
|---|---|---|---|---|---|---|
| **Visual System Redesign** | `src/styles/globals.css` | Yes | Yes | No | No | Low |
| **Theme Fix (Light/Dark/System)** | `src/features/settings/contexts/settings-context.tsx`, `globals.css` | Yes | Yes | No | No | Low |
| **Navigation Simplification (4 Primary Hubs)** | `src/app/router.tsx`, `src/components/layout/AppShell.tsx` | Yes | Yes | No | No | Medium |
| **Collapsible Desktop Sidebar** | `src/components/layout/AppShell.tsx` | Yes | Yes | No | No | Low |
| **Mobile UI/UX Polish** | `src/components/layout/AppShell.tsx`, feature views | Yes | Yes | No | No | Medium |
| **Dashboard Hierarchy & Cleanup** | `src/features/overview/OverviewPage.tsx` | Yes | Yes | No | No | Low |
| **Mid-Month / Starting Balance Semantics** | `src/features/financial/utils/calculations.ts`, `OverviewPage.tsx` | Yes | Yes | No | No | Medium |
| **Graph Improvements** | `src/features/insights/components/CashFlowTrend.tsx` | Yes | Yes | No | No | Low |
| **Income vs Expenses Trend** | `src/features/insights/components/CashFlowTrend.tsx` | Yes | Yes | No | No | Low |
| **Compact Export Center (Top Right)** | `src/features/insights/components/ExportPanel.tsx` | Yes | Yes | No | No | Low |
| **Expense Category Expansion (Gas/Fuel, etc.)** | `supabase/migrations/20260704000002_default_categories.sql` | Yes | No | Yes | Yes (Seed migration) | Low |
| **Recurring Transactions UX & Education** | `src/features/transactions/RecurringPage.tsx` | Yes | Yes | No | No | Low |
| **Naming & Terminology Audit** | UI string tokens across all feature components | Yes | Yes | No | No | Low |
| **20 Financial Questions UI** | `src/features/insights/` | No | No | Yes | No | Medium |
| **AI Data Contract & Intent Engine** | `src/features/financial/utils/calculations.ts` | Yes | No | Yes | No | Medium |
| **AI Local Agent / Explanation Layer** | New module (`src/features/ai/`) | No | No | Yes | No | High |
| **Opt-In Email Preferences** | `src/features/settings/` | Yes | Yes | No | Yes (Profile columns) | Low |
| **Email Weekly & Monthly Delivery** | Backend / Scheduled Edge Function | No | No | Yes | Yes (Edge function) | High |

---

## 4. Financial Calculation Audit

### 4.1 Existing Financial Engine Inventory
The centralized calculation module [`src/features/financial/utils/calculations.ts`](file:///e:/PFM/src/features/financial/utils/calculations.ts) contains all deterministic financial formulas:

1. `calculateAccountBalance(account, transactions)`: Dynamic balance calculation combining `opening_balance` and all historical income, expense, and transfer transactions.
2. `calculateTotalAccountBalance(accounts, transactions)`: Groups active account balances by currency code.
3. `getSingleCurrencyNetPosition(accounts, transactions)`: Sums net liquid assets while enforcing single-currency safety.
4. `calculatePeriodIncome(transactions, startDate, endDate)`: Sums income transactions (excluding transfers) within date bounds using integer cents.
5. `calculatePeriodExpenses(transactions, startDate, endDate)`: Sums expense transactions (excluding transfers) within date bounds.
6. `calculatePeriodSavings(transactions, startDate, endDate)`: Computes `Income - Expenses`.
7. `calculateSavingsRate(income, expenses)`: Computes `(Savings / Income) * 100` with 0% fallback for zero income.
8. `calculateCategorySpending(transactions, startDate, endDate)`: Groups expenses by category UUID.
9. `calculateAvailableBalance(accounts, transactions)`: Computes total available liquid capital.
10. `calculatePeriodComparisonMulti(...)`: Computes period-over-period absolute and percentage changes.
11. `groupCashFlowByInterval(...)`: Groups cash flow by daily, weekly, or monthly intervals.

### 4.2 Single Source of Truth Rule Verification
- **Audit Finding**: Page components across `OverviewPage.tsx`, `PlanningPage.tsx`, `AccountsPage.tsx`, and `InsightsPage.tsx` currently consume `calculations.ts` without writing custom inline financial logic.
- **V1.1 Constraint**: V1.1 dashboard cards, graph data, insights, email reports, and AI explanations **MUST** consume this existing calculation engine. No inline array reduce operations or independent math calculation logic may be written inside new components or AI modules.

---

## 5. Mid-Month / Starting Balance Audit

### 5.1 Current Behavior
- When a user initializes PFM on September 15th with an account opening balance of ₹50,000 and enters ₹30,000 in expenses without entering new income, the Overview header presents:
  - `Period Income`: ₹0
  - `Period Expenses`: ₹30,000
  - `Period Net`: -₹30,000
- **User Perception Issue**: The negative net figure can be alarming to a new user who actually possesses ₹20,000 in available cash.

### 5.2 Root Cause Analysis
- `opening_balance` on `public.accounts` is stored as an account property representing starting capital, not as a transaction in `public.transactions`.
- `calculatePeriodIncome` strictly aggregates rows from `public.transactions` where `transaction_type === 'income'`. Thus, starting balance is correctly excluded from income.
- However, the dashboard header visually emphasizes `Period Net` without prominently displaying the **Total Available Funds** (`calculateAvailableBalance`), leading to user confusion between period cash flow and current account solvency.

### 5.3 Architectural Solution for V1.1
1. **Accounting Distinction**:
   - `Starting Balance` = Initial capital asset (Available Money).
   - `Period Income` = Earned revenue during current period.
   - `Period Expenses` = Spent money during current period.
   - `Available Balance` = Total net liquid position across all active accounts (`calculateAvailableBalance`).
2. **Dashboard UI Refinement**:
   - Display **Available Balance** as the primary hero metric.
   - Display **Period Cash Flow Summary** (`Period Income`, `Period Expenses`, `Period Net`) with clear explanatory tooltips clarifying that opening balance is an asset, not monthly income.
3. **Database Impact**: Zero database schema changes required.

---

## 6. Recurring Transactions Audit

### 6.1 Database Schema & Structure
The recurring system is defined in `supabase/migrations/20260707000001_recurring_transactions.sql`:
- `public.recurring_rules`: Stores schedule templates (`frequency`: `weekly`, `monthly`, `quarterly`, `yearly`; `next_due_date`; `start_date`; `end_date`; `is_active`).
- `public.recurring_occurrences`: Stores generated expected instances (`status`: `pending`, `confirmed`, `skipped`; `due_date`; `expected_amount`; `transaction_id`). Unique index on `(recurring_rule_id, due_date)`.
- `public.duplicate_dismissals`: Tracks user keep-both decisions for potential duplicate transactions.

### 6.2 Hardened PL/pgSQL RPC Workers
1. `generate_recurring_occurrences(p_horizon_date)`: `SECURITY DEFINER` function that locks user rules (`FOR UPDATE`), computes upcoming schedule dates with month-end anchor clamping (e.g., Jan 31 -> Feb 28), and idempotently inserts `pending` occurrences up to horizon date.
2. `confirm_recurring_occurrence(p_occurrence_id)`: `SECURITY DEFINER` function that locks the occurrence, validates ownership and account currency match, inserts a financial transaction into `public.transactions`, and marks the occurrence as `confirmed`.

### 6.3 Frontend Integration
- Managed via `src/features/transactions/hooks/useRecurringData.ts` and `src/features/transactions/utils/recurrence-math.ts`.
- **V1.1 Focus**: The underlying PL/pgSQL RPCs, database triggers, and recurrence mathematics are rock-solid and will be **preserved without modification**. V1.1 will improve UX, status indicators (`pending`, `confirmed`, `skipped`, `paused`), empty states, and onboarding tooltips.

---

## 7. Theme Audit

### 7.1 Current Storage & Application
- User theme preference is stored in `public.profiles.theme` (`'light'`, `'dark'`, `'system'`) and cached in `localStorage` as `pfm_theme`.
- Initialized in `src/features/settings/contexts/settings-context.tsx`.
- `applyThemeClass` adds/removes class `.dark` on `document.documentElement`.

### 7.2 Why Light Mode Currently Fails
In `src/styles/globals.css`, tokens are hardcoded inside Tailwind v4 `@theme`:
```css
@theme {
  --color-bg-primary: #08080a;
  --color-surface-primary: #15151a;
  ...
}
```
Because these variables are statically assigned under `:root`, removing class `.dark` from `document.documentElement` does not alter these CSS variables, causing light mode to render dark background hex colors.

### 7.3 V1.1 Theme Fix Architecture
Define CSS custom properties on `:root` and `.dark` blocks in `globals.css`:
```css
:root {
  --color-bg-primary: #f8fafc;
  --color-surface-primary: #ffffff;
  --color-surface-secondary: #f1f5f9;
  --color-border-neutral: #e2e8f0;
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;
  --color-brand-orange: #ea580c;
  --color-brand-purple: #9333ea;
}

.dark {
  --color-bg-primary: #09090b;
  --color-surface-primary: #121215;
  --color-surface-secondary: #1a1a22;
  --color-border-neutral: #272732;
  --color-text-primary: #f8fafc;
  --color-text-secondary: #9ca3af;
  --color-text-muted: #575765;
  --color-brand-orange: #f97316;
  --color-brand-purple: #a855f7;
}
```

---

## 8. Navigation Audit

### 8.1 Current Desktop Sidebar
Located in [`src/components/layout/AppShell.tsx`](file:///e:/PFM/src/components/layout/AppShell.tsx):
- Fixed width `w-60` (240px).
- Renders 9 items: Overview, Transactions, Accounts, Goals, Budgets & Planning, Recurring Rules, Insights, Metals, Settings.

### 8.2 Current Mobile Navigation
- Renders fixed bottom bar with `grid grid-cols-7` containing all 9 navigation links.
- **Defect**: Grid columns overflow on small screens (<380px width), creating tiny icon buttons and label clipping.

### 8.3 V1.1 Proposed Information Architecture
Restructure primary navigation into **4 core sections**:
1. **Home (`/overview`)**: Overview Dashboard & Available Funds.
2. **Transactions (`/transactions`)**: Unified hub with sub-tabs for `Transactions List`, `Accounts`, and `Recurring Rules`.
3. **Planning (`/planning`)**: Financial strategy hub with sub-tabs for `Budgets`, `Goals`, and `Metals`.
4. **Insights (`/insights`)**: Analytics hub containing Cash Flow Trends, Category Outlays, Financial Questions Engine, and Compact Export Center.

### 8.4 Desktop Sidebar Collapse
Add an expand/collapse toggle button storing `isCollapsed` boolean state in `localStorage` (`pfm_sidebar_collapsed`):
- **Expanded (240px)**: Icon + Text Label + Status Badges.
- **Collapsed (64px)**: Icon only + CSS hover tooltip (`title` or custom tooltip wrapper).

---

## 9. Mobile UX Audit

### 9.1 Audited Viewports
- Tested responsive CSS definitions at `375px` (iPhone SE), `390px` (iPhone 12/13/14), and `430px` (iPhone Pro Max).

### 9.2 Identified Mobile UX Deficiencies
1. **Bottom Nav Overcrowding**: 9 links in `grid-cols-7` causing horizontal squeeze.
2. **Table Horizontal Overflow**: `TransactionsPage.tsx` table requires horizontal scrolling without clear touch affordances.
3. **Modal Dialog Height**: Modals on mobile currently use standard desktop modal wrappers rather than mobile-friendly bottom sheets (`drawer` pattern).

### 9.3 V1.1 Mobile Recommendations
- Restructure mobile bottom navigation to render 4 clean tabs (**Home**, **Transactions**, **Planning**, **Insights**).
- Convert transaction tables on mobile to stacked card lists.
- Enforce touch-friendly tap targets (minimum 44x44px touch boundaries).

---

## 10. Graph & Insights Audit

### 10.1 Chart Architecture Inventory
- **Implementation**: Charts in PFM are built using **pure, accessible HTML/CSS flex/grid horizontal bars with Tailwind styling** (no third-party heavy charting bundle dependencies like Chart.js or Recharts).
- **Files**:
  - [`src/features/insights/components/CashFlowTrend.tsx`](file:///e:/PFM/src/features/insights/components/CashFlowTrend.tsx)
  - `src/features/insights/components/SavingsTrend.tsx`
  - `src/features/insights/components/SpendingBreakdown.tsx`

### 10.2 Income vs Expenses Trend Review
- **Current Presentation**: Stacked horizontal bar list comparing Income vs Expense totals per interval.
- **V1.1 Enhancement**: Add clear visual indicator of Net Cash Flow per interval (`Income - Expense`) and smooth period-over-period trend sparkline.

### 10.3 Local Export Center Relocation
- **Current Location**: Rendered as a full page card section at the bottom of `InsightsPage.tsx` ([`ExportPanel.tsx`](file:///e:/PFM/src/features/insights/components/ExportPanel.tsx)).
- **V1.1 Target**: Relocate to a compact top-right export dropdown / action button in the Insights header.

---

## 11. Category Audit

### 11.1 Category Data Model
- Defined in `supabase/migrations/20260704000001_financial_foundation.sql` (`public.categories`).
- System default categories have `user_id IS NULL` and `is_system = TRUE`. Custom user categories have `user_id = auth.uid()` and `is_system = FALSE`.
- Unique constraints: `(name, transaction_type)` for system categories.

### 11.2 Category Expansion Strategy
- Missing default categories identified by Master Plan: `Gas / Fuel`.
- **Strategy**: Add an idempotent SQL seed migration in `supabase/migrations/` inserting missing default categories:
```sql
INSERT INTO public.categories (name, transaction_type, is_system, is_active) VALUES
  ('Gas / Fuel', 'expense', TRUE, TRUE)
ON CONFLICT (name, transaction_type) WHERE user_id IS NULL DO NOTHING;
```
- Existing historical transactions and category UUIDs will remain **100% intact**. No existing categories will be deleted or modified.

---

## 12. Email System Audit

### 12.1 Current Codebase State
- **Audit Result**: "Not verified in current repository." No email dispatch code, background job schedulers, or email provider integrations currently exist in the codebase.

### 12.2 V1.1 Email Architecture
1. **User Profile Consent Columns**:
   Add preference columns to `public.profiles`:
   - `email_notifications_enabled` (BOOLEAN DEFAULT FALSE)
   - `weekly_summary_enabled` (BOOLEAN DEFAULT FALSE)
   - `monthly_report_enabled` (BOOLEAN DEFAULT FALSE)
2. **Delivery Mechanism**:
   - Supabase Edge Function (`supabase/functions/send-financial-email`) or external cron job consuming Supabase REST API with `service_role` authorization.
   - HTML Email templates generated using trusted financial metrics calculated by server-side RPC or Node function.
   - Strict explicit opt-in enforcement: No email will be sent to users with `email_notifications_enabled = FALSE`.

---

## 13. AI / Local Agent Audit

### 13.1 Current Codebase State
- **Audit Result**: "Not verified in current repository." No AI code or LLM integration exists in the repository.

### 13.2 Core Question Engine Mapping (20 Questions)
The 20 Master Plan questions map directly to existing calculation functions in `calculations.ts`:

| Question Category | Sample Question | Data Engine Source |
|---|---|---|
| **17.1 Money Overview** | "How much did I spend this month?" | `calculatePeriodExpenses(txs, start, end)` |
| **17.2 Spending & Budget** | "Which category went over budget?" | `useBudgetData()` + `calculateCategorySpending` |
| **17.3 Debt & Bills** | "How much debt did I pay off?" | `calculateCategorySpending` for loan/credit categories |
| **17.4 Savings & Goals** | "Which goal had most progress?" | `calculateGoalProgress(goal, contributions)` |
| **17.5 Recurring** | "Which recurring expense could I review?" | `public.recurring_rules` amount ranking |
| **17.6 Cash Position** | "How much money is available?" | `calculateAvailableBalance(accounts, txs)` |

### 13.3 AI Separation Rule & Architecture
- Module location: `src/features/ai/`.
- Pipeline:
  `User Question` → `Intent Router` → `Trusted Metric Payload` → `Natural Language Explanation Generator`.
- Guardrails: AI receives structured JSON payload only. AI **never** calculates or infers numbers independently. Guaranteed deterministic template engine fallback when local LLM is offline or uninitialized.

---

## 14. Security Audit

### 14.1 Security Audit Verification
- **Row-Level Security (RLS)**: Active on all 12 tables (`accounts`, `categories`, `transactions`, `tags`, `transaction_tags`, `goals`, `goal_contributions`, `budgets`, `budget_categories`, `recurring_rules`, `recurring_occurrences`, `duplicate_dismissals`, `profiles`).
- **RPC Security**: PL/pgSQL functions execute with `SECURITY DEFINER` and set explicit `search_path = public`. Authentication checked via `auth.uid() IS NULL` guard checks.
- **Client Credentials**: Client bundle only contains public `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. `service_role` keys are not present in client code.

---

## 15. Performance Audit

### 15.1 Audit Findings & Guidelines
- **Memoization**: Calculation hooks (`useOverviewData`, `useInsightsData`) wrap metrics calculations in `React.useMemo` to prevent UI lag during state updates.
- **Date Bounds**: Transaction filters specify `startDate` and `endDate` parameters to limit query sizes.
- **AI Asset Isolation**: Track B AI assets/models will be loaded dynamically via async imports (`import()`) only when the user opens the Question interface, ensuring standard app bundle size remains lightweight (<250KB gzipped).

---

## 16. Files Likely to Change

### Must Change
- `src/styles/globals.css`: Dual CSS custom properties for light/dark theme fix.
- `src/components/layout/AppShell.tsx`: 4-section navigation, desktop collapsible sidebar, mobile bottom nav fix.
- `src/app/router.tsx`: Updated routes for tabbed navigation hubs.
- `src/features/overview/OverviewPage.tsx`: Available funds card hierarchy, mid-month starting balance presentation.
- `src/features/insights/InsightsPage.tsx`: Relocate export panel to top-right header, add financial questions engine.
- `src/features/insights/components/ExportPanel.tsx`: Compact header action trigger.

### Probably Change
- `src/features/transactions/TransactionsPage.tsx`: Tabbed structure hosting Accounts & Recurring rules.
- `src/features/budgets/PlanningPage.tsx`: Tabbed structure hosting Budgets, Goals, and Metals.
- `src/features/transactions/RecurringPage.tsx`: Enhanced status badges & onboarding education text.
- `src/features/settings/SettingsPage.tsx`: Profile email consent settings.

### Possibly Change
- `src/features/settings/contexts/settings-context.tsx`: Enhanced theme toggle sync.

### New Files
- `src/features/ai/`: Questions intent router, metrics payload builder, natural language generator.
- `supabase/migrations/20260906000001_v1_1_email_preferences.sql`: Migration for email preferences & missing default categories (`Gas / Fuel`).

### Do Not Change
- `src/features/financial/utils/calculations.ts`: Core deterministic financial calculation engine (108 unit tests).
- `src/features/financial/utils/date-utils.ts`: Date bounds calculations.
- Existing PL/pgSQL RPCs (`confirm_recurring_occurrence`, `generate_recurring_occurrences`).

---

## 17. Database / Migration Requirements

### Required Migrations
1. `20260906000001_v1_1_preferences_and_categories.sql`:
   - Add `email_notifications_enabled`, `weekly_summary_enabled`, `monthly_report_enabled` columns to `public.profiles`.
   - Seed missing default category `Gas / Fuel` into `public.categories`.

### No Migrations Required For
- Core financial tables (`accounts`, `transactions`, `budgets`, `goals`, `recurring_rules`, `recurring_occurrences`).

---

## 18. Architecture Risks

1. **Theme CSS Variable Scope**: Standardizing Tailwind v4 `@theme` with CSS custom variables must be thoroughly tested across light/dark modes to prevent color regressions.
2. **Sub-Route Deep Links**: Transitioning to tabbed navigation (`/transactions`, `/planning`) must preserve legacy deep links (`/accounts`, `/goals`, `/metals`) via route redirects (`<Navigate to="..." />`) to prevent broken user bookmarks.

---

## 19. Open Decisions Required From Product Owner

Before starting feature implementation in Milestone 10:
1. **Accent Palette Preference**: Confirm dual accent strategy (Primary: Orange `#f97316`, Secondary: Purple `#a855f7`).
2. **Email Delivery Provider**: Confirm target email provider (Resend vs SendGrid vs Supabase SMTP) for Milestone 14.
3. **AI Local Engine Technology**: Confirm whether initial V1.1 AI explanation layer uses a deterministic natural language engine or browser-based small LLM.

---

## 20. Recommended V1.1 Implementation Roadmap

Based on codebase readiness, the recommended milestone sequence is:

```
[M9 Audit & Architecture Freeze] (Current - Complete)
          │
          ▼
[M10 Layout, Navigation & Theme Fix] (Globals CSS, 4-Hub AppShell, Collapsible Sidebar)
          │
          ▼
[M11 Dashboard, Graphs & Available Funds] (Overview UI, Mid-Month starting balance presentation)
          │
          ▼
[M12 Transactions, Categories & Recurring UX] (Missing categories seed, Recurring UX education)
          │
          ▼
[M13 Insights, 20-Questions UI & Compact Export] (Top-right export, Intent question UI)
          │
          ▼
[M14 Email & Notification Infrastructure] (Profile consent, Email templates, Scheduled jobs)
          │
          ▼
[M15 AI Track & Local Financial Agent] (Metrics payload adapter, Explanation engine)
          │
          ▼
[M16 V1.1 Integration, QA & Production Hardening] (Regression testing, Build & Security validation)
```

---

## 21. Audit Conclusion

The repository and architecture audit for **PFM V1.1** is **COMPLETE**. No source code, database tables, migrations, or auth settings were altered during this audit. The codebase is well-structured, fully tested, and ready to begin **Milestone 10 (Navigation, Layout & Theme)** upon product owner approval.
