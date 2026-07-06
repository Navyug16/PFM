# Planning Intelligence Architecture - Milestone 5

This document details the technical design of the budgeting, planning, and goal forecasting layer in the Personal Finance Manager (PFM) application.

---

## 1. Scope and Database Schema

### Monthly Budget V1 Scope
*   **V1 Choice**: Monthly budgets are the primary planning model. Yearly spending budgets are **not** implemented in V1; completed monthly budgets are archived historically and can be aggregated dynamically, keeping the schema uncluttered.

### Database Tables
1.  **`public.budgets`**: Represents the overall spending plan.
    *   `id` (UUID, Primary Key)
    *   `user_id` (UUID, references `auth.users(id)`)
    *   `name` (TEXT, non-empty)
    *   `start_date` (DATE)
    *   `end_date` (DATE)
    *   `total_limit` (DECIMAL)
    *   `currency` (VARCHAR(3))
    *   `is_active` (BOOLEAN)
2.  **`public.budget_categories`**: Connects categories to budgets with a customized allocation limit.
    *   `id` (UUID, Primary Key)
    *   `budget_id` (UUID, references `budgets(id)`)
    *   `category_id` (UUID, references `categories(id)`)
    *   `allocated_amount` (DECIMAL)
    *   Unique index on `(budget_id, category_id)`.

### RLS Policies
Both tables have Row-Level Security enabled:
*   Users can only read, write, edit, or delete budgets where `user_id = auth.uid()`.
*   Category allocations are scoped so users can only perform operations if the associated `budget_id` belongs to them (`budget_id IN (SELECT id FROM budgets WHERE user_id = auth.uid())`).
*   Spoofing of `user_id` is prevented using `auth.uid()` checks `WITH CHECK` during inserts and updates.

### Integrity Constraints
1.  **Ownership and Type Enforcement**: Triggers guarantee that category allocations reference expense categories belonging to the user (or system categories) and enforce `transaction_type = 'expense'`.
2.  **Allocation Cap Constraint**: The sum of category allocations cannot exceed the total budget limit. A database trigger `validate_allocation_totals()` computes the allocations sum and blocks the save if it exceeds the limit.
3.  **Unallocated Budget Margin**: Category allocations are not required to equal the overall budget limit. Any remaining limit is tracked as `Unallocated Margin = Total Limit - Sum of Allocations` and acts as a buffer.
4.  **Uncategorized Expenses**: Expense transactions logged under categories that do not have specific budget allocations still count toward overall spending but are displayed separately under an "Uncategorized" row.
5.  **Neutrality Guards**: Bank transfers and income deposits are explicitly excluded from budget spending calculations.
6.  **Active Budget Constraint**: The trigger `prevent_overlapping_active_budgets()` ensures at most one active budget exists per user, currency, and overlapping date ranges at any given time.

---

## 2. Deterministic Calculation & Pace Engine

To deliver mathematically consistent projections, the engine implements a unified **inclusive of today** date-counting model:

*   **Total Period Days**: $(D_{end} - D_{start}) + 1$
*   **Elapsed Days**: $(\text{Today} - D_{start}) + 1$
*   **Remaining Days**: $(D_{end} - \text{Today}) + 1$
*   **Budget Spent**: Sum of actual expense transactions in bounds (transfers and income are ignored).
*   **Daily Safe to Spend**:
    $$\text{Daily Safe to Spend} = \frac{\max(\text{Remaining Budget}, 0)}{\text{Remaining Days}}$$
*   **Projected Period Spending**:
    $$\text{Projected} = \frac{\text{Spent}}{\text{Elapsed Days}} \times \text{Total Period Days}$$
*   **Projected Budget Variance**: $\text{Limit} - \text{Projected Spending}$

### Pace Status Thresholds
*   Let $E = \frac{D_{elapsed}}{D_{total}}$ and $S_{expected} = L \times E$.
*   **Projections Safeguard**: Projections can be volatile early in a month. 
    1.  If $D_{elapsed} < 3$, the pace status defaults to **`safe`** (unless the limit is already exceeded).
    2.  If the total spent is under 50% of the limit ($S < L \times 0.50$) AND total transaction count is $< 3$, the status defaults to **`safe`**.
    3.  **Bypass Rule**: If category limit usage is $\ge 50\%$, the transaction safeguard is bypassed to ensure large category outlays are flagged immediately.
*   Otherwise:
    1.  **`exceeded`**: If $S > L$.
    2.  **`at_risk`**: If $S > S_{expected}$ and $V_{projected} < -0.10 \times L$.
    3.  **`watch`**: If $S > S_{expected}$ and $-0.10 \times L \le V_{projected} < 0.00$.
    4.  **`safe`**: If $S \le S_{expected}$ or $V_{projected} \ge 0.00$.
    5.  **`unavailable`**: If the limit is 0 or date ranges are invalid.

---

## 3. Savings Goal Intelligence

Goal metrics are calculated inside `calculations.ts` to identify if a user is saving at a rate that allows them to achieve their target:

*   **Goal Elapsed Percentage**: Clamped percentage $[0, 100]$ of time elapsed between the goal's start date and target date.
*   **Expected Progress**: Linear target progress based on elapsed time ratio.
*   **Goal Pace Status**: Compares actual savings with expected progress using a 2% tolerance boundary:
    *   **`ahead`**: Saved amount exceeds target or is above expected progress by at least 2% of target.
    *   **`behind`**: Saved amount is behind expected progress by more than 2% of target.
    *   **`on_track`**: Saved amount is within the 2% tolerance boundary.
*   **Projected Completion Date**: Estimated completion based on daily contribution rate:
    $$\text{Rate} = \frac{\text{Saved Amount}}{\text{Elapsed Days}}$$
    $$\text{Remaining Days} = \frac{\text{Target} - \text{Saved}}{\text{Rate}}$$
    $$\text{Projected Completion} = \text{Today} + \text{Remaining Days}$$
*   **Recovery Savings Target**: Monthly amount required to complete the savings goal by the target date:
    $$\text{Recovery Target} = \frac{\text{Remaining Amount}}{\text{Remaining Months}}$$

---

## 4. Current Data Freshness Behavior

PFM uses React state hooks with on-mount fetching:
1.  **On-Mount Reloading**: Every page (`OverviewPage`, `PlanningPage`, `TransactionsPage`, `GoalsPage`) fetches current Supabase data inside its `useEffect` hook upon mounting.
2.  **Local Mutation Refresh**: Successful operations on the current page immediately trigger an inline state refresh or call the local `fetchData()` handler to update the active dashboard view.
    *   Logging an expense via the Overview Quick Action modal refreshes Overview data.
    *   Creating, updating, or archiving a budget on the Planning Page refreshes Planning data.
    *   Adding a transaction on the Transactions Page refreshes Transactions data.
3.  **Cross-Route Synchronization**: There is no cross-route background synchronization; navigating to or mounting another page fetches fresh Supabase records via standard React on-mount hooks.
