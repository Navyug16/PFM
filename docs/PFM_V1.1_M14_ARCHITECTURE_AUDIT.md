# PFM V1.1 Milestone 14 — Email & Notification System Architecture Audit Report

**Project**: Personal Finance Manager (PFM)  
**Version**: V1.1  
**Milestone**: M14 — Email & Notification System  
**Phase**: Phase 1 — Architecture & Current-Code Audit  
**Date**: September 13, 2026  
**Status**: Completed (Audit-Only — Pending Product Review)

---

## 1. Executive Summary

This report establishes the technical architecture, baseline audit, and implementation plan for **Milestone 14 (Email & Notification System)** of the Personal Finance Manager (PFM) application. 

### Key Findings
1. **Zero Email Infrastructure currently exists**: The application currently has no email dispatch SDKs, no email provider credentials, no Edge Functions, no scheduled cron jobs, and no email preference columns in the database.
2. **Database State**: The `public.profiles` table contains preference fields for `theme`, `currency`, `locale`, `week_start`, `fy_start_month`, and `date_format`, but does **NOT** contain `email_notifications_enabled`, `weekly_summary_enabled`, or `monthly_report_enabled`.
3. **Calculation Engine Readiness**: The core financial calculation engine (`src/features/financial/utils/calculations.ts`) is robust, integer-cent accurate, and fully capable of driving weekly summaries and monthly reports.
4. **Security & Opt-In Guarantee**: Strict explicit opt-in enforcement is required. The system will default all consent toggles to `FALSE`, ensuring zero unsolicited emails are sent.

---

## 2. Current Repository State

- **Application Architecture**: Vite + React 19 + TypeScript 6.0 + Tailwind CSS 4 frontend backed by Supabase Auth and PostgreSQL.
- **Active Migrations**: 7 migration files present in `supabase/migrations/`.
- **Environment**: Client variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are exposed to Vite. No privileged `service_role` keys or email API keys are present in the frontend context.

---

## 3. Database & Profile Audit

### Verified Current State
- `public.profiles` table schema:
  - `id` (UUID, Primary Key, FK to `auth.users.id`)
  - `display_name` (TEXT)
  - `theme` (TEXT, DEFAULT 'system')
  - `currency` (VARCHAR(3), DEFAULT 'INR')
  - `locale` (TEXT, DEFAULT 'en-IN')
  - `week_start` (INT, DEFAULT 1)
  - `fy_start_month` (INT, DEFAULT 4)
  - `date_format` (TEXT, DEFAULT 'YYYY-MM-DD')
  - `created_at` / `updated_at` (TIMESTAMPTZ)
- **RLS Policies Active on `public.profiles`**:
  - `Users can view their own profile` (`auth.uid() = id`)
  - `Users can update their own profile` (`auth.uid() = id`)
  - `Users can insert their own profile` (`auth.uid() = id`)

### Missing Columns (Required for M14 Phase 2)
The following columns **do not exist** and must be added in Phase 2:
- `email_notifications_enabled` (`BOOLEAN DEFAULT FALSE NOT NULL`)
- `weekly_summary_enabled` (`BOOLEAN DEFAULT FALSE NOT NULL`)
- `monthly_report_enabled` (`BOOLEAN DEFAULT FALSE NOT NULL`)

---

## 4. Authentication & Email Source Audit

- **Auth Framework**: Supabase Auth (`@supabase/supabase-js`).
- **User Email Access**: Recipient email address is stored securely in `auth.users.email`.
- **Safest Email Source**: For server-side automated scheduled jobs (Edge Functions / cron), the recipient email must be fetched directly from `auth.users` via the Supabase Admin API using the `service_role` key inside a secure server-side environment. Client-provided email strings must never be trusted for automated report dispatches.

### Email Confirmation Rule (M14 Proposed Rule)
Email dispatch to unconfirmed email addresses must be prohibited.

*(Recommended M14 rule — requires product approval before delivery implementation)*:
```
CAN_SEND_WEEKLY =
  email_notifications_enabled
  AND weekly_summary_enabled
  AND valid auth email exists
  AND email is confirmed

CAN_SEND_MONTHLY =
  email_notifications_enabled
  AND monthly_report_enabled
  AND valid auth email exists
  AND email is confirmed
```

---

## 5. Settings & Profile UI Architecture

- **Existing UI**: `src/features/settings/SettingsPage.tsx` manages user preferences through sidebar tabs (`profile`, `preferences`, `appearance`, `security`, `privacy`, `danger`).
- **Hook & API Abstraction**: `useSettings()` hook wraps `getProfile()` and `updateProfile()` in `src/features/settings/api/settings-api.ts`.
- **Phase 2 Settings Scope**:
  - Add a dedicated `NotificationSettings.tsx` tab component under Settings.
  - Expose toggles for:
    1. Global Email Notifications (`email_notifications_enabled`)
    2. Weekly Summary Email (`weekly_summary_enabled`)
    3. Monthly Financial Report (`monthly_report_enabled`)
  - Disable child report toggles when Global Email Notifications is set to OFF.

---

## 6. Financial Calculation Reuse Audit

All report figures must originate from the existing trusted calculation engine (`src/features/financial/utils/calculations.ts`). M14 **MUST** reuse existing calculation logic and **MUST NOT** create a second financial calculation engine.

### Capability Classification
1. **Supported Now (Direct Reuse)**:
   - `calculatePeriodIncome`: Period total income
   - `calculatePeriodExpenses`: Period total expenses
   - `calculatePeriodSavings`: Net saved amount
   - `calculateSavingsRate`: Savings percentage
   - `calculateCategorySpending`: Category expense breakdowns
   - `identifyLargestExpenseCategory`: Top spending category
   - `comparePeriodSpending`: Period-over-period percentage comparisons
   - `calculateAvailableBalance`: Total liquidity balance
2. **Supported with Server Adapter**:
   - `calculateBudgetPerformance`: Budget utilization per category
   - `calculateGoalProgressPercentage` / `calculateGoalRemaining`: Goals tracker state
   - `useRecurringData` / occurrence calculations: Upcoming & paid recurring commitments
   - M13 Anomaly Engine (`quality-engine.ts`): Quality warning detection
3. **Not Currently Supported**:
   - Automated HTML email layout rendering engine (will be created in M14 Phase 4).

---

## 7. M13 Integration Audit

- **Actual Reusable M13 Infrastructure**:
  - `question-engine.ts`: Question resolution logic and deterministic answer generation based on existing financial calculations.
  - `report-calculations.ts`: `calculateCategoryBreakdown` utility for category spending share and period-over-period category comparisons.
  - `duplicate-engine.ts`: Candidate duplicate transaction detection.
  - `quality-engine.ts`: Data quality evaluation rules (uncategorized expenses, missing account metadata).
- **M14 Rule**: M14 email generation must strictly consume these existing M13 & core financial calculation utilities rather than defining redundant math algorithms.
- **Export Utilities (`csv-export.ts`)**: CSV export logic is designed for text file downloads. Email dispatch will use structured HTML templates rather than plain CSV attachments.

---

## 8. Existing Email Infrastructure Audit

- **Verified Result**: ZERO email dispatch infrastructure currently exists in the repository.
- **Dependencies Search**: No references to `resend`, `sendgrid`, `postmark`, `nodemailer`, or `aws-sdk` exist in `package.json`.

---

## 9. Email Provider Evaluation

| Provider | Integration Complexity | Server Secret Requirements | Supabase / Deno Compatibility | Transactional Suitability | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Resend** | **Low** (Simple HTTP REST API / Deno fetch) | `RESEND_API_KEY` | **Native** (Deno & Node compatible) | **Excellent** (Built for HTML transactional email) | **RECOMMENDED** |
| **SendGrid** | Medium (v3 REST API / SDK) | `SENDGRID_API_KEY` | Good | Good | Alternative |
| **Supabase Custom SMTP** | High (Requires custom Auth SMTP setup) | SMTP Credentials | Native (Auth only) | Poor (Designed for Auth OTPs/resets) | Not Recommended |

### Recommended Provider
- **Provider**: **Resend**
- **Technical Justification**: Lightweight HTTP REST API (can be invoked directly via Deno native `fetch` in Supabase Edge Functions without NPM dependencies), excellent HTML email deliverability, clean dashboard for delivery tracking, and generous free tier (3,000 emails/month).
- **Credential Provisioning Timing**: Resend credentials (`RESEND_API_KEY`) must **NOT** be required in Phase 2. They will be introduced only when actual server-side delivery infrastructure is created in Phase 5.

---

## 10. Scheduling Architecture Analysis

### Recommended Architecture: Supabase Edge Function + External Cron Trigger
1. **Edge Function**: `supabase/functions/send-financial-email`
2. **Trigger Mechanism**: External cron trigger (e.g. Vercel Cron, GitHub Actions Cron, or Supabase `pg_cron`) invoking the Edge Function via HTTP POST.
3. **Security Authorization**: Edge Function verifies `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` or a custom `x-cron-secret` header.
4. **Execution Flow**:
   - Cron triggers Edge Function on a set schedule (e.g., Every Monday at 08:00 UTC for Weekly; 1st of every month for Monthly).
   - Edge Function queries eligible users with `service_role` key.
   - Computes period date boundaries in UTC/user timezone.
   - Evaluates financial calculations and builds email HTML.
   - Dispatches via Resend API and logs result in `email_logs` table.

---

## 11. Consent & Preference Architecture

### Strict Consent Formula
```
CAN_SEND_WEEKLY = email_notifications_enabled AND weekly_summary_enabled AND email_confirmed
CAN_SEND_MONTHLY = email_notifications_enabled AND monthly_report_enabled AND email_confirmed
```

### Governance Rules
- All consent fields default to `FALSE`.
- Disabling `email_notifications_enabled` globally blocks all email dispatches regardless of individual toggles.
- Unsubscribed or non-consented users will be skipped silently during batch execution.

---

## 12. Weekly Email Specification (PROPOSED — REQUIRES PRODUCT APPROVAL)

### Proposed Contents
1. **Header**: Personal Greeting + Date Range (e.g., Sep 07, 2026 – Sep 13, 2026).
2. **Weekly Summary Cards**:
   - Total Income (+₹X)
   - Total Expenses (-₹Y)
   - Net Savings (₹Z)
   - Savings Rate (S%)
3. **Top Spending Category**: Category name, total amount, and percentage of weekly expenses.
4. **Week-over-Week Trend**: Percentage comparison vs previous week.
5. **Call to Action**: "Open PFM Dashboard" button.

---

## 13. Monthly Email Capability Matrix & Scope

### Core M14 Monthly Report Scope (Mandatory)
- **Total Income**: `calculatePeriodIncome` (Supported Now)
- **Total Expenses**: `calculatePeriodExpenses` (Supported Now)
- **Net Savings**: `calculatePeriodSavings` (Supported Now)
- **Savings Rate**: `calculateSavingsRate` (Supported Now)
- **Category Spending Breakdown**: `calculateCategorySpending` / `calculateCategoryBreakdown` (Supported Now)
- **Deterministic Insights**: Reused M13 deterministic rules (Supported Now)

### Optional Scope (Included Only If Verified with Existing Data)
- **Budget Performance**: `calculateBudgetPerformance` (Supported with Adapter)
- **Goals Progress**: `calculateGoalProgressPercentage` / `calculateGoalRemaining` (Supported with Adapter)
- **Recurring Expenses**: `useRecurringData` occurrences (Supported with Adapter)
- **Data Quality Warnings**: `evaluateTransactionQuality` (Supported with Adapter)

*Note: M14 is not committed to implementing every optional section automatically unless verified during template implementation.*

---

## 14. Idempotency, Concurrency & Locking Strategy

To prevent duplicate email dispatches during concurrent cron executions, server restarts, or network retries, M14 requires a delivery log table with an atomic claiming mechanism:

### Table Definition: `public.email_logs`
```sql
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  claimed_at TIMESTAMP WITH TIME ZONE,
  claim_expires_at TIMESTAMP WITH TIME ZONE,
  provider_message_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  CONSTRAINT unique_user_report_period UNIQUE (user_id, report_type, period_start, period_end)
);
```

### Atomic Claim & Locking Strategy (Concurrency Safety)
1. **Pre-flight Lock / Claim**:
   When an Edge Function worker processes a user report for `(user_id, report_type, period_start, period_end)`:
   - Executes an atomic SQL `INSERT ... ON CONFLICT DO UPDATE`:
     ```sql
     INSERT INTO public.email_logs (
       user_id, report_type, period_start, period_end, status, claimed_at, claim_expires_at
     ) VALUES (
       $user_id, $report_type, $period_start, $period_end, 'pending', NOW(), NOW() + INTERVAL '10 minutes'
     )
     ON CONFLICT (user_id, report_type, period_start, period_end)
     DO UPDATE SET 
       status = 'pending',
       claimed_at = NOW(),
       claim_expires_at = NOW() + INTERVAL '10 minutes'
     WHERE email_logs.status = 'failed' 
        OR (email_logs.status = 'pending' AND email_logs.claim_expires_at < NOW())
     RETURNING id;
     ```
2. **Concurrency Guarantee**:
   - If a record with status `'sent'` already exists, the `WHERE` clause prevents any update, and no rows are returned -> Worker skips silently (Idempotency preserved).
   - If two cron jobs invoke concurrently, PostgreSQL row locking ensures only **ONE** worker receives the `RETURNING id` row -> Prevents duplicate sends.
3. **Retry Safety**:
   - If a dispatch failed previously (`status = 'failed'`) or timed out (`claim_expires_at < NOW()`), the atomic claim succeeds -> Allows retry without deleting audit history.
4. **Historical Delivery Audit**:
   - Historical records are never deleted, maintaining a complete delivery log.

---

## 15. Security Audit

- **Client Key Security**: Verified `.env` contains only public keys (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Privileged service-role keys are strictly server-side.
- **Row Level Security (RLS)**: `public.profiles` RLS enforces `auth.uid() = id`. `email_logs` table will also be protected via RLS so users can only view their own delivery logs.
- **AI/LLM Isolation**: Zero financial data is transmitted to AI/LLM models for email processing.
- **Security Assessment**: **NO M14 SECURITY BLOCKER FOUND**.

---

## 16. M11 / M12 / M13 Regression Protection

The implementation of M14 will preserve the following core files without alteration:
- Dashboard & Overview: `src/features/overview/OverviewPage.tsx`
- Financial Engine: `src/features/financial/utils/calculations.ts`
- Date Engine: `src/features/financial/utils/date-utils.ts`
- Transactions & Categories: `src/features/transactions/` & `src/features/categories/`
- Insights & Questions: `src/features/insights/`

---

## 17. Proposed M14 File Structure

```
src/features/settings/
└── components/
    └── NotificationSettings.tsx           [NEW in Phase 2]

src/features/email/                        [NEW Directory in Phase 3/4]
├── types/
│   └── email.ts
└── utils/
    └── email-payload-builder.ts

supabase/
├── functions/                             [NEW Directory in Phase 5]
│   └── send-financial-email/
│       ├── index.ts
│       ├── resend-client.ts
│       └── templates/
│           ├── weekly-summary-template.ts
│           └── monthly-report-template.ts
└── migrations/
    └── 20260914000001_m14_email_preferences_and_logs.sql  [NEW in Phase 2]
```

---

## 18. Phase 2 Scope & Boundary

### Phase 2 Implements ONLY:
1. Migration for profile email preference fields (`email_notifications_enabled`, `weekly_summary_enabled`, `monthly_report_enabled`).
2. Settings UI component (`NotificationSettings.tsx` tab).
3. Explicit opt-in consent behavior & preference persistence via `useSettings()`.
4. Preference-related unit/integration tests.

### Phase 2 MUST NOT Implement:
- Resend SDK / client / API keys
- Supabase Edge Functions
- Cron / scheduled jobs
- Email templates
- Email sending / dispatch logic
- `email_logs` table / delivery logging
- Retry workers

---

## 19. Recommended M14 Implementation Sequence

- **Phase 1: Architecture Audit (CURRENT PHASE — Complete)**
- **Phase 2: Email Preferences & Consent** (Database Migration & Settings UI ONLY)
- **Phase 3: Trusted Financial Email Data Pipeline** (Payload Builders & Server Adapters)
- **Phase 4: Email HTML Templates** (Responsive HTML/CSS Email Design)
- **Phase 5: Secure Scheduled Delivery** (Supabase Edge Function + Resend Integration)
- **Phase 6: Failure / Retry / Idempotency Logging** (`email_logs` integration)
- **Phase 7: Comprehensive QA & Verification**

---

## 20. Phase 2 Prerequisites

Before proceeding to Phase 2 implementation, the following prerequisites must be met:
1. Review and approval of this Architecture Audit Report.
2. Approval of proposed database migration schema for profile preferences.

*Note: Provisioning Resend API credentials is NOT required for Phase 2 and will be deferred to Phase 5.*

---

## 21. QA & Automated Checks Verification

- **Lint Check**: Passed (`eslint src --max-warnings 0`)
- **Typecheck**: Passed (`tsc --noEmit`)
- **Build Check**: Passed (`vite build`)
- **Working Tree**: Pristine (Audit-only report created; no code changes made).

---

## 22. Final Recommendation

**PHASE 1 AUDIT COMPLETE — ARCHITECTURE REQUIRES THE ABOVE CLARIFICATIONS BEFORE PHASE 2.**
