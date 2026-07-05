# Overview Intelligence & Daily Money Experience

This document details the architecture, formulas, and layout decisions behind the PFM **Overview Page**, designed around the core product promise: **"Understand where your money is in under 60 seconds."**

---

## 1. Overview Philosophy: Understand → Notice → Act

Unlike conventional dashboards that list flat transaction tables, PFM prioritizes interpretation and immediate understanding. The visual hierarchy directs the user through:
- **UNDERSTAND**: Top-level Current Balances (Stock) and Period Flows (Income/Expenses/Savings).
- **NOTICE**: Deterministic, prioritized question cards highlighting trends, deficit warnings, or pacing delays.
- **ACT**: Easy access to logging actions (Expense, Income, Transfer) and navigations to core tools.

---

## 2. Stock vs. Flow Metrics

PFM clearly separates and labels balance types to prevent user confusion:

### Stock Metrics (Current State)
Represents the total financial position at the present moment, independent of the reporting window:
- **Available Balance**: Calculated as the sum of current balances for active liquid accounts (`checking`, `savings`, `cash`). Liabilities (`credit_card`, `loan`) are excluded.
- **Net Position**: The overall financial value, calculated by summing all active accounts (where liabilities are entered as negative numbers).

### Flow Metrics (Period State)
Aggregates activity logged strictly within the selected reporting period:
- **Income — Period**: Sum of all income transactions.
- **Expenses — Period**: Sum of all expense transactions.
- **Savings — Period**: Calculated as `Income - Expenses`.
- **Savings Rate**: `(Savings / Income) * 100` (defaults to `0%` if income is zero).

---

## 3. Question-Driven Insight System

The section **"Questions about your money"** automatically generates answers to questions users frequently ask:

| Question | Logic & Source |
|---|---|
| **Where did most of my money go?** | Aggregates period expenses by category, showing the category with the highest spend, total amount, and its relative percentage share. |
| **What was my biggest expense?** | Finds the individual expense transaction with the maximum amount in the period. |
| **Am I spending more or less?** | Compares current period expenses against the equivalent elapsed comparison period. |
| **How much did I save?** | Displays savings amount and rate with contextual progress remarks. |
| **Am I on track for my goal?** | Loops through active goals to evaluate linear elapsed progress. |

### Insight Prioritization
Insights are sorted dynamically by urgency using a priority score (highest first):
1. **Deficit Alert** (Savings are negative) — *Priority 6 (Highest)*.
2. **Behind-pace Goals** — *Priority 5*.
3. **Significant Spending Spikes** (>10% increase) — *Priority 5*.
4. **Largest Category Highlight** — *Priority 4*.
5. **Largest Single Expense** — *Priority 3*.
6. **Savings Rate Performance** — *Priority 2*.
7. **On-track / Ahead Goals** — *Priority 1*.

---

## 4. Period Comparison Engine

To support daily financial tracking, PFM utilizes **Equivalent Elapsed-Period Comparison**.
- Comparing *This Month* (e.g., July 1–10) compares against the *same elapsed duration* of the previous month (June 1–10), rather than comparing a partial current month to a complete previous month.
- JavaScript date rollover safeties prevent calendar offset bugs (e.g. subtracting one calendar month from July 31 cap-adjusts to June 30).

---

## 5. Goal Pace Definition & Tolerance

A goal's pace determines if a user is saving enough to meet their target date linearly:
- **Expected Progress**: `(Days Elapsed / Total Duration) * Target Amount`
- **Actual Progress**: Current saved amount (Opening balance + contributions).
- **Progress Difference**: `Actual Progress - Expected Progress`
- **Tolerance rule (2%)**: A goal is classified as:
  - `ahead` if `Progress Difference >= Target Amount * 0.02` or `Actual Progress >= Target Amount`.
  - `behind` if `Progress Difference <= -Target Amount * 0.02`.
  - `on_track` if it sits within the 2% tolerance boundary.

---

## 6. Cash Flow & Category Share Visuals

- **Cash Flow History**: Grouped double-bars representing Income vs Expenses. Groups by day for Weekly periods, by weeks for Monthly periods, and by month for Financial Year periods. Custom Tailwind indicators are used to ensure fast renders and responsive dark mode alignment without third-party chart package dependencies.
- **Spending Breakdown**: Ranked list of top-spending categories represented with progress bars.

## 7. Performance, Data Fetching & Bounded Queries

### Data Fetching Strategy & Scale Limitation
- **Current V1 Strategy**: The system fetches the user's active accounts and the entire lifetime transaction history in a single request. 
- **Derived-Ledger Limit**: Because PFM derives accounts' current balances dynamically from the transaction ledger, retrieving the full transaction list is required to ensure mathematical correctness.
- **Filtering & Performance**: Partitions for selected periods (e.g. current week, month, comparison window) are computed reactively in memory. This is highly performant for V1 scale (up to several thousand transactions) because it avoids N+1 queries and removes the latency of hitting Supabase when switching period tabs.

### Future Scaling Optimization Path
As transaction history grows past several thousand records per user, loading full histories on each session start will impact network bandwidth and client-side processing speeds. Future optimizations should introduce:
1. **Materialized Daily Balance Snapshots**: A Postgres table or cron script tracking the balance of each account at the end of each day.
2. **Aggregated Analytical RPCs**: Supabase stored procedures (`RPC` queries) that execute bounding operations (e.g. category shares, cash flows, date-bound flows) directly on the PostgreSQL host and return only the aggregated JSON payloads to the client.
3. **Optimized Pagination**: Loading transaction logs in pages (e.g. 50 items) for standard scroll lists, separating stock-calculating queries from period-viewing queries.

---

## 8. Screen Fallbacks & Empty States

- **Resilient Secondary Loaders**: Goals and Contributions are fetched inside separate catch blocks. A failure in goals does not prevent the dashboard from rendering accounts and transaction flows.
- **Dynamic Empty States**:
  - **No Accounts**: Displays full-page prompt to add checking/savings.
  - **No Transactions**: Displays full-page prompt to log the first entry.
  - **No Expenses in Period**: Displays warning inside insights/breakdowns explaining that analytics need expense data.
  - **No Goals**: Displays banner suggesting setting up target milestones.
