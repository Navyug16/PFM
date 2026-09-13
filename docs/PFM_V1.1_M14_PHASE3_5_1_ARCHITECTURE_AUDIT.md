# PFM V1.1 Milestone 14 — Phase 3.5.1: Email Template Architecture Audit Report

**Project**: Personal Finance Manager (PFM)  
**Version**: V1.1  
**Milestone**: M14 — Email & Notification System  
**Phase**: Phase 3.5.1 — Email Template Architecture Audit  
**Date**: September 13, 2026  
**Status**: AUDIT ONLY — COMPLETED (Zero Implementation Executed)

---

## 1. Executive Summary

This architecture audit report establishes the technical blueprint, security specifications, email client HTML strategy, and execution boundaries for **Milestone 14 Phase 3.5 (Email Template Layer)** of the Personal Finance Manager (PFM) repository.

### Key Audit Findings
1. **Zero Existing Email Infrastructure**: The repository currently contains no email HTML renderers, mailer utilities, template engines, HTML sanitizers, or React-email dependencies.
2. **Contract & Builder Compatibility**: The trusted email payload contract (`EmailReportPayload` from Phase 3.2) and the payload builders (`buildWeeklyEmailPayload` from Phase 3.3, `buildMonthlyEmailPayload` from Phase 3.4) are 100% compatible and produce unified, read-only data payloads ready for presentation.
3. **Pure Presentation Paradigm**: The upcoming Email Template Renderer MUST act as a pure, deterministic transformer (`EmailReportPayload → Email-safe HTML string`). It MUST NOT perform financial calculations, database queries, or external network requests.
4. **Server & Edge Readiness**: To support server-side delivery (Phase 3.6 Edge Functions / Node.js / Deno execution), the template layer must use pure TypeScript HTML string generation with inline CSS, completely free of browser DOM dependencies (`window`, `document`, `localStorage`) or client-side React state.
5. **Strict HTML Security**: All user-controlled and dynamic strings in the payload (`displayName`, `categoryName`, `title`, `statement`) MUST be sanitized through a pure HTML entity escaping function to eliminate XSS injection risks.

---

## 2. Existing Email Infrastructure Audit

A thorough search across the repository (`src/`, `package.json`) yielded the following status:

| Category | Present in Repository | Details / Path |
| :--- | :---: | :--- |
| **Email HTML Templates** | **NONE** | Zero files found. |
| **HTML Email Renderers** | **NONE** | Zero renderers found. |
| **Email Utility Functions** | **Partial (Payload Builders Only)** | Phase 3.3 & 3.4 payload builders exist (`weekly-payload-builder.ts`, `monthly-payload-builder.ts`). |
| **Mailer Utilities** | **NONE** | No sending or mailer utilities exist. |
| **Email Formatting Helpers** | **Partial (General Only)** | General financial formatters exist (`formatCurrency`, `formatPercentage`, `formatDate` in `src/features/financial/utils/formatters.ts`). |
| **Notification UI Components** | **Present (Settings UI Only)** | Phase 2 preference management tab (`NotificationSettings.tsx`). |
| **Transactional Email Code** | **NONE** | Zero transactional email handling exists. |
| **HTML Escaping Utilities** | **NONE** | `escapeCSVValue` in `csv-export.ts` is CSV-specific and cannot be used for HTML. |
| **Sanitization Libraries** | **NONE** | DOMPurify, sanitize-html, etc. are not present. |
| **Email Dependencies** | **NONE** | React Email, MJML, Juice, etc. are not present. |
| **Inline CSS Utilities** | **NONE** | Tailwind CSS v4 is used for web UI, but no inline-CSS tool exists. |

---

## 3. Package & Dependency Audit

Inspection of `package.json` confirms the project's current dependencies:

- **Dependencies**: `@supabase/supabase-js`, `lucide-react`, `react`, `react-dom`, `react-router-dom`.
- **DevDependencies**: `@tailwindcss/vite`, `@types/node`, `@types/react`, `@types/react-dom`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `@vitejs/plugin-react`, `eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, `prettier`, `tailwindcss`, `typescript`, `typescript-eslint`, `vite`, `vitest`.

### Recommendation on Dependencies for Phase 3.5
- **Do NOT install new npm packages** (e.g., `@react-email/components`, `mjml`, `juice`, `handlebars`, `he`).
- **Justification**: 
  1. **Zero Footprint**: Pure TypeScript template functions require no extra runtime dependencies or bundle overhead.
  2. **Edge Compatibility**: Third-party libraries often rely on Node.js built-ins (`fs`, `stream`, `path`) or virtual DOM bundling, which complicate deployment in Supabase Edge Functions (Deno runtime).
  3. **Performance & Reliability**: String templates with inline CSS execute instantly, deterministically, and with zero compilation latency.

---

## 4. Phase 3.2 Contract Audit

Inspection of [`src/features/email/types/email.ts`](file:///e:/PFM/src/features/email/types/email.ts) confirms the exact master domain contract:

```typescript
export interface EmailReportPayload {
  reportType: EmailReportType // 'weekly' | 'monthly'
  generatedAt: string // ISO 8601 Timestamp
  user: EmailUserContext // { displayName, currency, locale, dateFormat }
  period: EmailReportPeriod // { startDate, endDate, formattedRange }
  summary: EmailFinancialSummary // { totalIncome, totalExpenses, netSavings, savingsRate, previousPeriodExpenses?, expensePercentChange? }
  categories: EmailCategorySpendingItem[] // { categoryId, categoryName, amount, percentage, transactionCount?, direction? }
  topCategory?: EmailCategorySpendingItem
  insights: EmailInsightItem[] // { id, type, title, statement, severity }
}
```

### Presentation Safety & Field Verification
All fields in `EmailReportPayload` have been pre-computed by trusted engines and are safe for presentation:
- `user.displayName`: Requires HTML escaping.
- `user.currency` & `user.locale`: Drive localized `formatCurrency` formatting.
- `period.formattedRange`: Displayed directly in header/banner.
- `summary`: Metrics ready for direct currency and percentage display.
- `categories`: Array sorted by expense amount; used for category table.
- `topCategory`: Used for top-spending highlight section if present.
- `insights`: Deterministic array from M13 insight engine; titles and statements require HTML escaping.

---

## 5. Phase 3.3 & 3.4 Payload Builder Audit

Inspection of the payload builders:
- Weekly: [`buildWeeklyEmailPayload`](file:///e:/PFM/src/features/email/utils/weekly-payload-builder.ts)
- Monthly: [`buildMonthlyEmailPayload`](file:///e:/PFM/src/features/email/utils/monthly-payload-builder.ts)

### Builder Findings
1. **Unified Output Contract**: Both builders return the identical `EmailReportPayload` structure, setting `reportType: 'weekly'` or `reportType: 'monthly'` respectively.
2. **Structural Compatibility**: Weekly and monthly payloads are **100% compatible** with a single, shared template architecture.
3. **Optional Fields**:
   - `summary.previousPeriodExpenses` & `summary.expensePercentChange`: Present when baseline transaction comparison is available; optional in monthly payloads if previous period dates are omitted.
   - `topCategory`: Optional (`undefined` if zero expense transactions exist in period).
   - `category.transactionCount` & `category.direction`: Optional attributes.

---

## 6. Formatting Utilities Audit

Inspection of [`src/features/financial/utils/formatters.ts`](file:///e:/PFM/src/features/financial/utils/formatters.ts) confirms existing formatting helpers:
- `formatCurrency(val, currency, locale)`
- `formatPercentage(val)`
- `formatDate(dateStr, dateFormat, locale)`

### Trust Boundary Rule: Allowed vs Not Allowed

| Operation Category | Description | Status |
| :--- | :--- | :---: |
| **ALLOWED** | `formatCurrency(10000, 'INR', 'en-IN')` → `"₹10,000.00"` | ✅ Presentation |
| **ALLOWED** | `formatPercentage(35.5)` → `"35.5%"` | ✅ Presentation |
| **ALLOWED** | Date string formatting (`"Sep 01 – Sep 30, 2026"`) | ✅ Presentation |
| **NOT ALLOWED** | `payload.summary.totalIncome - payload.summary.totalExpenses` | ❌ Financial Math |
| **NOT ALLOWED** | Recalculating `savingsRate` or category share percentages | ❌ Financial Math |
| **NOT ALLOWED** | Evaluating period-over-period percentage differences | ❌ Financial Math |

---

## 7. HTML Escaping & Security Audit

User-controlled input values (such as `user.displayName`, `category.categoryName`, `insight.title`, `insight.statement`) MUST NOT be inserted into HTML strings unescaped.

### Threat Analysis
Malicious payload injections such as:
- `<script>alert(1)</script>`
- `<img src=x onerror=alert(1)>`
- `<svg onload=alert(1)>`
- `" onmouseover="alert(1)`

If rendered unescaped, these could lead to cross-site scripting (XSS) or email web client rendering hijacks.

### Safe Minimal Security Utility (For Phase 3.5 Implementation)
Phase 3.5 must implement a standalone, pure function `escapeHtml` under `src/features/email/templates/html-escaper.ts`:

```typescript
export const escapeHtml = (str: string | null | undefined): string => {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
```
All dynamic payload strings passed into HTML templates will pass through `escapeHtml()`.

---

## 8. Email HTML Strategy Evaluation

We evaluated four strategies for generating email HTML:

| Strategy | Pros | Cons | Recommendation |
| :--- | :--- | :--- | :---: |
| **Option A: Pure TypeScript HTML String Templates + Inline CSS** | Zero external dependencies, 100% portable (Node/Deno/Edge), instant deterministic rendering, full control over table layouts. | Requires manual HTML/CSS table string composition. | **RECOMMENDED** |
| **Option B: React Email (`@react-email/components`)** | Component JSX syntax. | Adds heavy npm dependencies, requires JSX transpilation & React DOM server bundling in Edge Functions. | Not Recommended |
| **Option C: MJML** | Responsive abstraction layer. | Requires MJML compilation library (heavy Node dependency). | Not Recommended |
| **Option D: Custom Template Engine (Mustache/EJS)** | String tag template replacement. | Third-party dependency, potential escaping bugs. | Not Recommended |

### Justification for Option A
Option A (Pure TypeScript HTML String Templates with Inline CSS) is the cleanest, safest, and most lightweight approach for PFM. It requires no build tools or server dependencies, works seamlessly in Supabase Edge Functions, and delivers 100% deterministic HTML.

---

## 9. Server & Edge Function Compatibility

Phase 3.6 will execute email rendering in server/Edge Function environments (Supabase Edge Functions / Deno / Node.js).

### Audit Check
- **DOM Dependencies**: Pure TypeScript string templates have **ZERO** dependence on `window`, `document`, `HTMLElement`, or browser APIs.
- **State Dependencies**: Templates consume plain JSON objects (`EmailReportPayload`) with zero client React state or hooks.
- **Callable Interface**:
  - `renderWeeklyEmail(payload: EmailReportPayload): string`
  - `renderMonthlyEmail(payload: EmailReportPayload): string`
- **Result**: Fully compatible with server-side, CLI, and Edge Function execution.

---

## 10. Shared Template Architecture

Weekly and Monthly reports share 80%+ of their structure. Phase 3.5 should implement a modular template architecture:

```
src/features/email/templates/
├── html-escaper.ts                # Pure HTML entity escaper
├── email-layout.ts                # Shared email wrapper (head, body, container, header, footer)
├── email-components.ts            # Reusable HTML sections (Summary Cards, Category Table, Insights)
├── weekly-email-template.ts       # Weekly entry point: renderWeeklyEmail(payload)
└── monthly-email-template.ts      # Monthly entry point: renderMonthlyEmail(payload)
```

### Conceptual Render Pipeline
```
payload (EmailReportPayload)
   ↓
renderWeeklyEmail / renderMonthlyEmail
   ↓
email-components (Summary Cards + Category Table + Insights)
   ↓
email-layout (Outer container, Header, Personal Greeting, Footer)
   ↓
Deterministic HTML String
```

---

## 11. Weekly vs Monthly Differences

| Feature / Section | Weekly Email | Monthly Email |
| :--- | :--- | :--- |
| **Header Badge** | `Weekly Summary` | `Monthly Financial Report` |
| **Title / Subtitle** | "Your Weekly Financial Overview" | "Your Monthly Financial Deep-Dive" |
| **Period Comparison Label** | "vs Previous Week" | "vs Previous Month" |
| **Category Breakdown** | Top spending categories for the week | Top spending categories for the month |
| **Deterministic Insights** | Weekly spending alerts & highlights | Monthly financial health & trends |
| **Optional Extensions** | None | Deferred until trusted data sources exist |

### Optional Extension Status
`EmailOptionalReportExtensions` (budget performance, goals, recurring commitments) are defined as optional types in Phase 3.2. However, because builders do not currently populate them, **Phase 3.5 will not render these sections** until verified backend calculation providers are linked in future phases.

---

## 12. Branding & Visual Design Guidance

The email visual design must align with PFM's web app design system:

- **Primary Accent**: Brand Orange (`#ea580c` / `#f97316`).
- **Background**: High-contrast dark header/card elements on a clean neutral background (`#f8fafc` outer, `#ffffff` card container, `#09090b` dark header accent).
- **Typography**: System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`).
- **Semantic Colors**: Expense/Negative (`#ef4444`), Income/Positive (`#10b981`), Warning (`#f59e0b`).
- **Assets**: Must NOT rely on relative asset paths (`/assets/logo.png`). Branding will use styled CSS text badges (`PFM`).

---

## 13. Email Client Compatibility Constraints

To ensure flawless rendering across Outlook, Gmail, Apple Mail, and Yahoo Mail:

1. **Table-Based Layout**: All structural containers must use `<table>`, `<tr>`, `<td>` with explicit `width`, `cellpadding="0"`, `cellspacing="0"`, and `border="0"`.
2. **Inline Styles**: Every element must carry inline `style="..."` attributes (no relying on `<style>` block classes which Gmail/Outlook strip).
3. **Container Width**: Max container width set to `600px`, centered with `margin: 0 auto;`.
4. **No Modern Web Features**: No JavaScript, no flexbox/grid layout without table fallbacks, no external web fonts requiring `<link>`, no CSS animations.
5. **Mobile Responsiveness**: `max-width: 100%` on tables to fluidly downscale on mobile devices.

---

## 14. Empty & Zero-Data State Presentation

The template layer must handle edge-case payloads without throwing errors or calculating fallbacks:

| Condition | Presentation Behavior |
| :--- | :--- |
| **Zero Income / Zero Expenses** | Render formatted zero currency (`₹0.00`). Display 0.0% savings rate. |
| **No Categories (`categories: []`)** | Display a clean empty state row in table: *"No expense transactions recorded for this period."* |
| **No Top Category (`topCategory: undefined`)** | Hide the top category spotlight card gracefully. |
| **No Insights (`insights: []`)** | Render positive summary message: *"Your account had no urgent financial warnings or spending spikes this period."* |
| **Missing Previous Baseline** | Render `"N/A"` for percentage change pills instead of displaying invalid zero trends. |

---

## 15. Privacy & Boundary Audit

The Email Template layer has strict privacy and boundary constraints:

- ❌ MUST NOT call external APIs or third-party web services.
- ❌ MUST NOT invoke AI/LLM models.
- ❌ MUST NOT query Supabase database or access `service_role` keys.
- ❌ MUST NOT read auth sessions or localStorage.
- ❌ MUST NOT embed tracking pixels or external analytics scripts.
- ✅ MUST ONLY perform pure string transformation (`Payload → HTML`).

---

## 16. Recommended Phase 3.5 File Structure

When Phase 3.5 implementation begins, the following files should be created under `src/features/email/templates/`:

```
src/features/email/templates/
├── html-escaper.ts
├── html-escaper.test.ts
├── email-layout.ts
├── email-components.ts
├── weekly-email-template.ts
├── weekly-email-template.test.ts
├── monthly-email-template.ts
└── monthly-email-template.test.ts
```

---

## 17. Test Strategy Recommendation

Phase 3.5 implementation should include comprehensive Vitest unit tests covering:

1. **`html-escaper.test.ts`**:
   - Escaping `<`, `>`, `&`, `"`, `'`.
   - Neutralizing `<script>`, `<img onerror>`, and `<svg onload>` payloads.
   - Handling null, undefined, and empty string inputs.
2. **`weekly-email-template.test.ts`**:
   - Normal weekly payload rendering output.
   - Zero-data weekly payload rendering.
   - Missing optional fields handling.
   - HTML escaping of user display name and insight text.
   - Immutability check (input payload is not mutated).
3. **`monthly-email-template.test.ts`**:
   - Normal monthly payload rendering output.
   - Zero-data monthly payload rendering.
   - Missing baseline comparison handling.
   - Deterministic output verification.

---

## 18. Phase 3.5 Boundary Verification

Phase 3.5 is strictly limited to **Email HTML Template Generation**. It MUST NOT include:
- Resend / SendGrid SDK integration.
- Supabase Edge Functions or Deno scripts.
- Scheduled cron triggers or database polling.
- Delivery log creation (`email_logs`).
- Unsubscribe URL processing.
- Database schema changes or migrations.

---

## 19. Regression Protection Verification

Implementing Phase 3.5 will require **ZERO changes** to existing project files:
- `src/features/financial/utils/calculations.ts` (UNTOUCHED)
- `src/features/insights/utils/report-calculations.ts` (UNTOUCHED)
- `src/features/insights/utils/report-insight-engine.ts` (UNTOUCHED)
- `src/features/settings/utils/consent-evaluator.ts` (UNTOUCHED)
- `src/features/email/types/email.ts` (UNTOUCHED)
- `src/features/email/utils/weekly-payload-builder.ts` (UNTOUCHED)
- `src/features/email/utils/monthly-payload-builder.ts` (UNTOUCHED)

---

## 20. Git Status & Safety Check

- **`git status` verification**: Working tree remains completely clean. Zero implementation files or package dependencies were added or modified during this audit. Only this audit document (`docs/PFM_V1.1_M14_PHASE3_5_1_ARCHITECTURE_AUDIT.md`) was generated.

---

## 21. Final Recommendation

**PHASE 3.5.1 AUDIT COMPLETE.** The proposed template architecture (Option A: Pure TypeScript HTML string templates with inline CSS and pure HTML escaping) is verified as the safest, cleanest, and most portable solution for PFM M14 Phase 3.5.
