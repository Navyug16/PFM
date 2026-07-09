# PFM Reporting & Financial Intelligence Architecture

This document details the architecture, design choices, calculations, and safeguards implemented in Milestone 7.

---

## 1. Architectural Overview

Milestone 7 introduces a pure, client-side, deterministic financial intelligence engine for PFM. It calculates performance metrics, structures periodic cash-flow trends, generates rule-based insights, and supports local spreadsheet-compliant exports.

### Unified Report Period System
*   Presets are mapped to start/end dates using current system dates:
    *   `This Week` (Monday to Today)
    *   `This Month` (1st to Today)
    *   `Last Month` (1st to Last day of last month)
    *   `Last 3 Months` (Trailing 3 complete months)
    *   `Last 6 Months` (Trailing 6 complete months)
    *   `This Calendar Year` (Jan 1 to Today)
    *   `Indian Financial Year` (April 1 to Today)
*   **Comparison Periods** shift matching day bounds backward (e.g. trailing weeks shift by 7 days, months by month offsets, and financial years by a full year offset) to compile comparable percentages.

---

## 2. Calculation Methods & Safeguards

### A. Recurring Expense Attribution
*   **Attribution Rule**: A transaction is flagged as recurring if and only if its transaction ID matches a confirmed occurrence's `transaction_id` database foreign key.
*   **No Heuristics**: Amount, date, categories, payees, or notes similarities are ignored for attribution.

### B. Structured Payee Analysis
*   Merchant ranking groups outlays strictly based on the transaction table's `payee_or_source` field.
*   Unspecified payees default to `"Unspecified Payee"`. Free-text transaction `notes` are not parsed as payees.

### C. Volatility Safeguards
*   A day's outlays must be **at least 2.0x** the period's daily average to trigger a `spending_spike` insight.
*   **Safety Threshold**: Insights are suppressed unless the period has:
    1.  At least **5 active spending days**.
    2.  At least **5 total expense transactions**.

### D. Zero Baseline Handling
*   If previous period outlays are ₹0, the percentage change is flagged as unavailable.
*   UI displays fallback messaging like `"New spending (+₹X vs no previous spending)"` rather than showing `+Infinity%` or `0%`.

---

## 3. CSV Export Schemas

All CSV files are assembled client-side in the browser:
*   **UTF-8 BOM Prefix** (`\uFEFF`) is prepended to support Unicode Indian characters (`₹`, category labels) in external spreadsheet software.
*   **Numeric Formatting**: Outputs standard unformatted float values (`15000.00`) without currency signs to ensure spreadsheet compatibility.
*   **Cell Escaping**: Commas, double-quotes (`""`), and carriage returns inside cells are safely double-quoted.

### Core Export Schemes:
1.  **Transactions CSV**: Date, Type, Account, Destination Account, Payee / Source, Category, Amount, Currency, Notes, Created At.
2.  **Account Balances CSV**: Account Name, Account Type, Currency, Opening Balance, Current Derived Balance, Status.
3.  **Category Spending CSV**: Category, Total Spent, Percentage of Expenses, Transaction Count, Average Transaction, Change vs Previous Period.
4.  **Goal Progress CSV**: Goal, Target Amount, Saved Amount, Remaining Amount, Progress Percentage, Target Date, Pace Status.

---

## 4. Performance & Scalability (V1 Target)

*   **In-Memory Architecture**: For V1, the hook loads the full ledger history in-memory and derives balances and reports locally.
*   **Design Target**: V1 design target: datasets up to approximately 5,000 transactions; formal performance benchmarking is deferred.
*   **V2 Scale Roadmap**: Should the ledger exceed 5,000 logs, the system will adapt to:
    1.  Backend SQL aggregation queries.
    2.  Materialized database reporting views.
    3.  Indexed date-bounded queries.
