# Daily Operations & Ledger Reliability Engine

This document outlines the architecture, constraints, and business logic for the Daily Money Operations and Ledger Reliability Engine implemented in Milestone 6.

---

## 1. Recurring Transactions Architecture

### Confirmation-Based Transactions
Predictable schedules are registered as templates rather than automatically posting to the financial ledger. The user receives a due/overdue indicator and must explicitly confirm or skip occurrences. This keeps the ledger accurate and aligned with real-world banking activity.

### Idempotent Lazy Occurrence Generation
Occurrences are generated dynamically when the user logs in or accesses the Overview/Planning pages. 
*   **Horizon**: Pending expectations are generated up to a rolling window of **Today + 30 days**.
*   **Concurrency Locks**: The database generation routine `generate_recurring_occurrences` executes inside a transaction that locks the user's `recurring_rules` rows (`FOR UPDATE`). Parallel executions wait, and unique constraints `(recurring_rule_id, due_date)` block double writes (`ON CONFLICT DO NOTHING`).
*   **State Management**: Only `pending`, `confirmed`, and `skipped` states are written to the database. Overdue and upcoming filters are derived dynamically at runtime.

### Atomic Confirmation Behavior
The `confirm_recurring_occurrence(occurrence_id)` RPC secures transactions database-side:
1.  Obtains an exclusive write lock on the target occurrence record (`FOR UPDATE`).
2.  Validates that the occurrence is still `pending`. If concurrent requests attempt confirmation, the second request sees `status = 'confirmed'` and exits cleanly, returning the existing transaction ID (idempotency).
3.  Validates user ownership of the rule, source account, and category.
4.  Creates exactly one `transactions` record and links its ID to the occurrence table.

### Date Anchoring & Leap Years
Monthly, quarterly, and yearly schedules preserve the original start day (e.g. Jan 31st):
*   Schedules falling on days exceeding month length (e.g. February) clamp to the last day of the month (Feb 28/29).
*   The math engine resets to the original anchor (March 31st) in subsequent cycles without introducing calendar drift.

### Fixed V1 Frequencies
Schedules support strict `weekly`, `monthly`, `quarterly`, and `yearly` cycles. Custom intervals (e.g., every 3 weeks) are excluded to prevent complexity.

---

## 2. Schedule Lifecycle Rules

### Pause
*   Disables the rule's active flag.
*   Deletes all future pending occurrences (`due_date > Today`).
*   Preserves overdue pending expectations.
*   Historical confirmed/skipped records remain unchanged.

### Resume
*   Re-enables the active flag.
*   Calculates the next scheduled date $\ge$ Today based on the calendar anchor.
*   Does **not** backfill occurrences for the period during which the rule was paused.

### Edit Propagation
Editing a rule:
*   Preserves all historical confirmed and skipped occurrences.
*   Preserves due-today and overdue pending occurrences.
*   Deletes and regenerates future pending occurrences (`due_date > Today`) using the updated rule parameters (amount, category, account).

### Archive
*   Allows disabling rules that have a confirmed transaction history.
*   Stops all future occurrence generation.
*   Historical transactions remain linked to the rule for auditing.
*   Hard deletion is restricted if confirmed history exists.

### Safe Deletion
*   Rules with **no confirmed history** can be hard-deleted from the database, cascading and deleting all pending expectations.

---

## 3. Reliability Engine Detections

### Double-Entry Duplicate Scanner
Scans transactions to flag double logs:
*   **High Confidence**: Identical transaction type, amount, account, category, and date.
*   **Medium Confidence**: Same type, amount, and account, with transaction dates differing by $\le 3$ days.
*   **Keep Both Persistence**: Users can dismiss a warning. This inserts a record into `duplicate_dismissals` for the sorted ID pair (`tx1_id < tx2_id`), preventing the alert from returning. Deleting either transaction cleans up the dismissal record.

### Transaction Quality Engine
Monitors the ledger and highlights review opportunities:
*   *Missing notes/payee*: Flags info warning.
*   *Uncategorized expense*: Flags review warning (affects budget analytics).
*   *Future dates*: Flags important warning.
*   *Old logs (>30 days)*: Flags info warning.
*   *Inactive Category/Account*: Flags important warning.

---

## 4. Freshness and Technical Limits

### In-App Reminders
*   Check-in banners render on the Overview dashboard if issues are present.
*   Clicking the banner launches the step-by-step Daily Check-In modal flow (**Review Bills** $\rightarrow$ **Clean Duplicates** $\rightarrow$ **Fix Quality Issues** $\rightarrow$ **Quick Log**).

### Offline Write Restrictions
*   Confirming or skipping occurrences requires executing RPC transactions. Thus, schedule confirmation actions are blocked during network offline states.

### Local-Date Timezone Limitations
*   Due dates and overdue filters compare ISO strings (`YYYY-MM-DD`) derived from the client's local system clock. A user changing time zones on boundary dates may see due indicators offset by one day.

### Data Freshness
*   Confirming, skipping, pausing, resuming, or editing rules refetches current datasets and updates the local view immediately.
*   Transactions ledger page automatically recalculates all duplicate and quality recommendations upon changes.
