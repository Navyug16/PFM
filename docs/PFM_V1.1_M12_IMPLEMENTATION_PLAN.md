# PFM V1.1 — Milestone 12 (M12) Implementation Plan (Revised & Approved)
**Transactions, Categories & Recurring UX**

---

## 1. Executive Summary & Core Principles

Milestone 12 focuses strictly on improving user experience, usability, visual clarity, and education for **Transactions**, **Categories**, and **Recurring Transactions**.

### Key Directives & Protections:
1. **Financial Engine & Accounting Protection**: All centralized financial logic (`calculations.ts`, `recurrence-math.ts`), account balance updates, RLS security policies, and RPC definitions remain 100% untouched.
2. **M11 Dashboard Protection**: M11 is complete. The Overview/Home dashboard will **NOT** be redesigned or modified during M12.
3. **No Invented Backend States**: Database enum values, stored state schemas, and RPC signatures will **NOT** be changed for UI convenience.
4. **No Unsupported Actions**: Features not currently backed by existing application code/RPCs (such as occurrence rescheduling, unskipping, or rule audit history) are strictly excluded.
5. **No Decorative Rainbow Colors / No Purple**: Category presentation must adhere strictly to the PFM dark/black design system, orange brand accent (`#F97316`), and restrained semantic indicators. Purple is strictly forbidden.
6. **Git Rule**: No `git commit` or `git push` commands will be run.

---

## 2. Transactions UX Audit

### 2.1 Current-State Inventory
- **Transaction List**: Displayed via responsive table/cards in [`TransactionsPage.tsx`](file:///e:/PFM/src/features/transactions/TransactionsPage.tsx). Supports sorting by date/amount, search query filtering, account filtering, category filtering, and transaction type tabs (`all`, `expense`, `income`, `transfer`).
- **Entry & Modals**: `TransactionForm` modal handles creation and editing. [`DailyCheckInModal.tsx`](file:///e:/PFM/src/features/transactions/components/DailyCheckInModal.tsx) provides rapid daily transaction logging.
- **Data Integrity Engines**: [`DuplicateWarningCard.tsx`](file:///e:/PFM/src/features/transactions/components/DuplicateWarningCard.tsx) and [`QualityWarningCard.tsx`](file:///e:/PFM/src/features/transactions/components/QualityWarningCard.tsx) alert users to duplicate entries and missing metadata.

### 2.2 Classification (KEEP / IMPROVE / REPLACE / REMOVE)

| Feature / UI Element | Classification | Rationale & Action |
| :--- | :---: | :--- |
| Transaction Table & Sorting / Search | **KEEP** | Functionally sound, clean layout, handles high volume efficiently. Preserve existing pagination and filters. |
| `DailyCheckInModal` Workflow | **KEEP** | Fastest path for quick daily logging; must not be broken or removed. |
| `DuplicateWarningCard` & `QualityWarningCard` | **KEEP** | Crucial for data quality and avoiding double entries. |
| Transfer Account UX | **IMPROVE** | Make the relationship visually clear with explicit "From Account" $\rightarrow$ "To Account" badges and field groupings without changing the underlying single/paired transfer data model. |
| Category Dropdown Picker | **IMPROVE** | Add inline search filter and category icons. Keep picker compact and clean without rainbow colors or cluttered badges. |
| Mobile Filter Bar | **IMPROVE** | Replace multi-row horizontal filter buttons with a clean mobile filter drawer sheet (375px, 390px, 430px). Keep search and active filter reset easily accessible. |
| Raw Database Error Toasts | **REPLACE** | Replace raw SQL error messages with friendly, actionable user guidance (e.g., "Unable to save transaction. Please check your internet connection and try again"). Preserve validation messages. |
| Decorative Subtitles on Mobile | **REMOVE** | Remove redundant descriptive text blocks on mobile screens to maximize vertical scroll area. |

---

## 3. Expense Categories Audit & Migration Safety

### 3.1 Existing Database Architecture & Constraint Inspection
Inspection of `supabase/migrations/20260704000001_financial_foundation.sql` reveals:
- **Table**: `public.categories` (`id`, `user_id`, `name`, `transaction_type`, `icon`, `is_system`, `is_active`).
- **Unique Partial Index**:
  ```sql
  CREATE UNIQUE INDEX IF NOT EXISTS unique_system_category 
  ON public.categories (name, transaction_type) WHERE user_id IS NULL;
  ```
- **Historical Integrity**: Referenced by `transactions.category_id REFERENCES categories(id) ON DELETE SET NULL`. Categories referenced by transactions must **NEVER** be hard-deleted.

### 3.2 Seed Audit & Minimum Addition Set
Inspection of `20260704000002_default_categories.sql` shows system categories already exist for `Groceries`, `Housing`, `Utilities`, `Transportation`, `Shopping`, `Health`, `Education`, `Entertainment`, `Travel`, `Subscriptions`, and `Personal Care`.

To avoid duplicate system categories, only missing defaults will be added via idempotent migration:
- **`Gas / Fuel`** (`expense`, icon: `Fuel`)
- **`Dining / Restaurants`** (`expense`, icon: `Utensils`)
- **`Insurance`** (`expense`, icon: `Shield`)

### 3.3 Safe Migration Script (`supabase/migrations/20260907000001_m12_categories.sql`)
```sql
-- Safe, idempotent category seeding matching exact system partial index
INSERT INTO public.categories (name, transaction_type, is_system, is_active, icon) VALUES
  ('Gas / Fuel', 'expense', TRUE, TRUE, 'Fuel'),
  ('Dining / Restaurants', 'expense', TRUE, TRUE, 'Utensils'),
  ('Insurance', 'expense', TRUE, TRUE, 'Shield')
ON CONFLICT (name, transaction_type) WHERE user_id IS NULL DO NOTHING;
```

---

## 4. Recurring Transactions — Deep Engine Audit & State Machine

### 4.1 Architecture & RPC Inspection
- **Rules (`recurring_rules`)**: Stores schedules (`frequency`, `amount`, `next_due_date`, `is_active`, `archived_at`).
- **Occurrences (`recurring_occurrences`)**: Stores individual scheduled dates (`due_date`, `status`, `confirmed_transaction_id`).
- **Existing Supported RPCs**:
  - `generate_recurring_occurrences(p_horizon_date)`: Idempotently generates occurrences up to horizon date.
  - `confirm_recurring_occurrence(p_occurrence_id)`: Atomically creates an actual transaction and marks occurrence `confirmed`.

### 4.2 Separation of Recurring Concepts (Stored vs Derived vs Rule States)

Stored occurrence statuses, date-derived presentation statuses, and recurring rule statuses will **NOT** be merged into an artificial database state machine.

#### A. Stored Occurrence Statuses (Database `recurring_occurrences.status`)
- `pending`
- `confirmed`
- `skipped`

#### B. Date-Derived Presentation Statuses (Computed from `due_date` vs TODAY)
- `pending` + `due_date > TODAY` $\rightarrow$ **Upcoming** (Slate Badge)
- `pending` + `due_date = TODAY` $\rightarrow$ **Due Today** (Amber Badge)
- `pending` + `due_date < TODAY` $\rightarrow$ **Overdue** (Red Warning Badge)
- `confirmed` $\rightarrow$ **Paid / Confirmed** (Emerald Green Badge)
- `skipped` $\rightarrow$ **Skipped** (Muted Gray Badge)

#### C. Recurring Rule States (Database `recurring_rules`)
- `is_active = true` AND `archived_at IS NULL` $\rightarrow$ **Active Schedule**
- `is_active = false` AND `archived_at IS NULL` $\rightarrow$ **Paused Schedule**
- `archived_at IS NOT NULL` $\rightarrow$ **Archived Schedule**

### 4.3 Supported Actions Only
| Feature Area | Supported Action | Backend Mechanism |
| :--- | :--- | :--- |
| Occurrence | **Mark as Paid** | Invokes trusted `confirm_recurring_occurrence` RPC; creates real transaction. |
| Occurrence | **Skip** | Updates occurrence `status = 'skipped'` via API; creates no transaction. |
| Rule | **Pause** | Invokes `pauseRecurringRule` API (`is_active = false`); deletes pending future occurrences. |
| Rule | **Resume** | Invokes `resumeRecurringRule` API (`is_active = true`, updates `next_due_date`). |
| Rule | **Archive** | Invokes `archiveRecurringRule` API (`archived_at = NOW()`). |

*Unsupported actions (reschedule, unskip, view history, preview amount) are strictly removed from planning.*

---

## 5. Recurring UX Redesign & Education

### 5.1 Dual-View Information Hierarchy
- **TAB 1: Action Center / Upcoming Payments**:
  - Priority Order: **Overdue** $\rightarrow$ **Due Today** $\rightarrow$ **Upcoming**.
  - One-click "Mark as Paid" and "Skip" buttons.
- **TAB 2: Recurring Schedules**:
  - Manage active, paused, and archived recurring rules with toggle switches.

### 5.2 Concise Helper Tooltips & Guidance
- **Confirming**: *"Confirming creates the actual transaction in your account balance."*
- **Skipping**: *"Skipping skips this instance without creating a transaction."*
- **Pausing**: *"Pausing stops future scheduled reminders. Existing transactions are preserved."*

### 5.3 Reliable Summary Metrics
- **Total Monthly Recurring Commitments**: Calculated accurately from active rules:
  - `weekly`: `amount * 52 / 12`
  - `monthly`: `amount`
  - `quarterly`: `amount / 3`
  - `yearly`: `amount / 12`
- **Action Required Count**: Count of occurrences where `status = 'pending'` and `due_date <= TODAY`.
- **7-Day Cash Outflow Forecast**: Sum of expected amounts from actual `pending` occurrences due within the next 7 days (derived directly from real database occurrences).

---

## 6. User-Facing Terminology Mapping

| Database / Technical Term | Proposed User-Facing Term | Reason |
| :--- | :--- | :--- |
| `recurring_rules` | Recurring Schedules & Bills | Human-friendly financial term. |
| `recurring_occurrences` | Upcoming Payments & Reminders | Clear descriptive label for scheduled items. |
| `confirm_recurring_occurrence` | Mark as Paid | Describes the real-world financial action. |
| `status = 'pending'` (`due_date > TODAY`) | Upcoming | Clear date-derived status. |
| `status = 'pending'` (`due_date = TODAY`) | Due Today | Direct urgency signal. |
| `status = 'pending'` (`due_date < TODAY`) | Overdue | Urgent attention required. |
| `status = 'confirmed'` | Paid / Confirmed | Confirms payment recorded. |
| `is_active = false` | Paused | Simple action-oriented state word. |

---

## 7. Mobile UX Optimization (375px, 390px, 430px)

- **Touch Target Size**: Minimum 44px height for all action buttons (`Mark as Paid`, `Skip`, filter triggers).
- **Mobile Filter Drawer**: Slide-up sheet on 375px/390px/430px viewports with clear search access and filter reset button.
- **Form Layout**: Single-column stacking; inputs avoid mobile soft-keyboard overlap.
- **Zero Horizontal Overflow**: Verified across all viewports.

---

## 8. Files Impacted & Protected

### 8.1 Files to Modify
- [`src/features/transactions/TransactionsPage.tsx`](file:///e:/PFM/src/features/transactions/TransactionsPage.tsx) (Filter UX, mobile drawer, empty states)
- [`src/features/transactions/RecurringPage.tsx`](file:///e:/PFM/src/features/transactions/RecurringPage.tsx) (Redesigned Action Center & Schedule Manager)
- [`src/features/transactions/components/TransactionForm.tsx`](file:///e:/PFM/src/features/transactions/components/TransactionForm.tsx) (Transfer account clarity, compact category search dropdown)
- [`src/features/transactions/components/RecurringRuleForm.tsx`](file:///e:/PFM/src/features/transactions/components/RecurringRuleForm.tsx) (Friendly terminology, validation)
- [`src/features/transactions/types/recurring.ts`](file:///e:/PFM/src/features/transactions/types/recurring.ts) (Derived state badge helper functions)

### 8.2 Files Protected (DO NOT MODIFY)
- [`src/features/financial/utils/calculations.ts`](file:///e:/PFM/src/features/financial/utils/calculations.ts) (Core calculation engine — PROTECTED)
- [`src/features/transactions/utils/recurrence-math.ts`](file:///e:/PFM/src/features/transactions/utils/recurrence-math.ts) (Recurrence math formulas — PROTECTED)
- `supabase/migrations/20260707000001_recurring_transactions.sql` (Existing RPC signatures — PROTECTED)
- All M11 Overview & Dashboard components (`OverviewPage.tsx`, `NetWorthCard.tsx`, etc.) — PROTECTED.

---

## 9. Comprehensive QA & Verification Plan

### 9.1 Automated Quality Assurance
Run all four mandatory check commands:
```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

### 9.2 Manual QA Checklist
1. **Transactions & Transfers**: Log income, expense, and transfer. Confirm "From Account" $\rightarrow$ "To Account" UX is clear and account balances update accurately.
2. **Categories**: Verify default categories populate correctly without duplicate entries or purple UI elements.
3. **Recurring Actions**:
   - Click "Mark as Paid" on overdue item $\rightarrow$ confirm transaction is created and occurrence switches to `Paid / Confirmed`.
   - Click "Skip" $\rightarrow$ confirm occurrence status becomes `Skipped` without ledger entry.
   - Pause schedule $\rightarrow$ verify schedule status badge shows `Paused`.
4. **Mobile Responsiveness**: Test at 375px, 390px, and 430px. Verify drawer, modal, and zero horizontal scroll.
5. **Accessibility**: Test keyboard tab navigation, visible focus rings, aria-labels, and non-color-only status indicators.

---

## 10. Post-Implementation Deliverables
1. Complete M12 code modifications and verify all 4 build/test passes.
2. Produce `docs/PFM_V1.1_M12_IMPLEMENTATION_REPORT.md` documenting test results, mobile QA, and verification output.
3. **DO NOT commit** or **push** changes (strict workspace rule).
