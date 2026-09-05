# PFM V1.1 Master Plan

Project: Personal Finance Manager (PFM)
Version: V1.1
Status: Planning / Requirements Freeze
Master Plan Type: Product, UX, Application Architecture & AI Track
Created: 2026-09-05

## 1. Purpose

This document is the source of truth for PFM V1.1.

V1.1 is an improvement and intelligence release built on top of the existing V1 production application. The goal is not to rewrite the application. The goal is to make PFM:

- easier to understand
- easier to operate
- visually cleaner
- better on mobile
- better at explaining financial information
- more useful for monthly financial review
- more reliable for real-world spending categorization
- more useful through recurring transaction understanding
- capable of user-consented financial email reports
- ready for a separate small/local AI financial-agent layer

Implementation prompts for Antigravity must be derived from this document. Antigravity must not independently redefine product requirements.

## 2. V1.1 Product Vision

PFM V1.1 should feel less like a financial database and more like a simple personal money companion.

The application should help a user answer three questions quickly:
1. What happened to my money?
2. What does it mean?
3. What should I pay attention to next?

The core financial calculations remain deterministic and trusted. AI is an explanation and assistance layer, not the financial source of truth.

## 3. V1.1 Core Principles

### 3.1 Improve, don't rewrite
Reuse the V1 architecture and existing financial functionality wherever possible.
Do not rewrite stable systems merely to implement a UI or naming improvement.

### 3.2 One source of truth for financial calculations
Existing centralized calculation utilities must remain the source of truth for:
- income
- expenses
- savings
- budgets
- goals
- account balances
- recurring attribution
- reports
- insights
- date-range calculations

Do not create competing calculation logic inside individual pages or inside the AI layer.

### 3.3 AI does not calculate financial truth
The future AI/local agent should consume trusted, structured financial metrics and explain them.
The architecture should follow:
`User Question → Question Intent → Trusted Financial Metrics → AI Explanation`
not:
`User Question → AI guesses/calculates financial data`

### 3.4 Simplicity over information density
A financial dashboard should not require financial expertise.
Charts, labels, navigation, terminology, cards and actions should be understandable at a glance.

### 3.5 Mobile is a first-class experience
Mobile UX must not be treated as an afterthought or merely as a smaller desktop layout.

### 3.6 Privacy by default
Financial data is sensitive.
AI and email functionality must follow explicit user consent and must not weaken existing authentication, RLS or data-access boundaries.

### 3.7 No silent behavior changes
Important financial semantics, authentication behavior, recurring behavior or historical transaction behavior must not change accidentally during UI work.

## 4. V1.1 Scope

V1.1 has two parallel but connected tracks.

### Track A — Application
- Visual redesign
- Theme fix
- Dashboard improvements
- Graph improvements
- Insights improvements
- Expense category expansion
- Recurring transaction UX/education
- Navigation simplification
- Collapsible desktop sidebar
- Mobile UI/UX
- Terminology improvements
- Mid-month starting-balance handling
- Email notification/report system
- Question interface improvements

### Track B — AI / Local Financial Agent
- Financial question framework (20 core questions)
- Trusted metric/data contract
- Financial explanation layer
- Spending and behavior explanations
- Goal/budget explanations
- Next-month recommendations
- Recurring expense explanations
- Privacy/local-agent architecture
- AI safety and accuracy guardrails

The AI track must remain separated from the core financial calculation engine.

## 5. V1.1 Requirements

### 5.1 Visual Design System
- Move away from the current purple-heavy visual identity.
- Primary visual foundation: black / dark neutral.
- Accent/button direction: orange and/or purple.
- Maintain strong contrast and accessibility.
- Avoid excessive colors; use color primarily to communicate meaning and hierarchy.
- Design goals: Professional, Modern, Clean, Finance-focused, Minimal visual noise, Strong hierarchy, Consistent components.

## 6. Theme Fix
- Investigate the current theme implementation before rewriting it.
- Verify light mode, dark mode, and system/default behavior.
- Ensure theme changes are reflected immediately and persist correctly.
- Ensure all major screens/components respect the selected theme.
- Remove hard-coded colors that prevent proper theme behavior.

## 7. Dashboard Improvements
- Goals: Improve hierarchy, make numbers obvious, reduce visual complexity, improve graph readability, improve mobile layout, make available funds understandable, avoid misleading income/expense presentation.
- Dashboard review: Every existing dashboard component should be classified as Keep, Improve, Replace, or Remove.

## 8. Mid-Month / Starting Balance Semantics
- Problem: Starting balances for existing accounts shouldn't be counted as monthly income.
- Required: Opening/starting balance must be clearly distinguished from period income, period expenses, transfers, and available funds.
- Audit the current V1 account/balance/transaction model before implementation.

## 9. Graph Improvements
- Graphs must become simpler and easier for ordinary users to understand.
- Prefer fewer visual elements, clear titles, direct labels, simple legends, meaningful tooltips, sensible date grouping, clear positive/negative states.
- Avoid overly decorative charts, excessive colors, unnecessary axes, dense data points.

## 10. Insights Improvements
- 10.1 Income vs Expenses Trend: Clear visual answer to "Am I earning more than I am spending?".
- 10.2 Local Export Center: Move to top-right area, compact export action/control rather than large section.

## 11. Expense Categories
- Add missing common categories (e.g. Gas / Fuel).
- Preserve historical transaction integrity and existing category references. Do not hard-delete categories in use.

## 12. Recurring Transactions
- Improve UX/education around recurring transactions (pending, confirmed, skipped, paused, resumed, edited, archived).
- Audit existing V1 recurring transaction stored occurrence states vs derived date-based states before changes.

## 13. Navigation Simplification
- Reduce unnecessary primary navigation items. Group related functionality.
- Proposed IA direction: Home, Transactions, Planning, Insights.
- Move secondary items and settings into appropriate sections.

## 14. Collapsible Desktop Sidebar
- Desktop sidebar collapse capability with smooth transitions, tooltip on collapsed hover/focus, preserving usability and route state.

## 15. Mobile UI/UX
- Mobile-first quality experience across Dashboard, Navigation, Accounts, Transactions, Categories, Budgets, Goals, Recurring, Insights, Questions, Settings, Export, Modals, Empty/Loading/Error states.
- Clear touch targets, no horizontal overflow, responsive forms, appropriate mobile dialogs/sheets.

## 16. Naming / Terminology Audit
- Simplify non-technical terms across UI (create mapping table during implementation). Keep DB identifiers intact unless technical need exists.

## 17. Financial Questions (20 Core Questions Framework)
- 17.1 Money overview (4 questions)
- 17.2 Spending and budget (4 questions)
- 17.3 Debt and bills (4 questions)
- 17.4 Savings and goals (3 questions)
- 17.5 Recurring and optimization (2 questions)
- 17.6 Cash position and behavior (3 questions)

## 18. Question Engine Principles
- Question intent mapping to trusted metrics data contract. AI layer only explains natural language results.

## 19. AI / Local Financial Agent Track
- Small financial assistant separated from core calculation engine.

## 20. AI Data Contract
- Structured metrics API input for Money, Categories, Goals, Recurring, Debt, Behavior.

## 21. AI Guardrails
- Never invent transactions, account balances, categories, goals, or bill statuses. Distinguish missing data from zero and estimates from exact values.

## 22. Local AI Direction
- Privacy, model size, browser/device capability, memory usage, offline capability evaluation.

## 23. Email System
- Opt-in Weekly notification and Monthly financial summary reports via scheduled background mechanism.

## 24. Email Preferences
- Explicit user consent controls in Settings.

## 25. Security Requirements
- RLS intact, no browser service-role key exposure, authenticated scoping.

## 26. Data Integrity
- Preserve historical data, transaction amounts, account balances, recurring rules.

## 27. Performance
- No duplicate queries or main-thread blocking by AI/heavy assets.

## 28. Accessibility
- Keyboard nav, visible focus, contrast, screen reader compatibility, touch targets.

## 29. V1.1 Milestone Strategy
- **M9 — V1.1 Audit, Architecture & Design System** (Current focus)
- M10 — Navigation, Layout & Theme
- M11 — Dashboard & Graphs
- M12 — Transactions, Categories & Recurring UX
- M13 — Insights, Questions & Export
- M14 — Email & Notification System
- M15 — AI / Local Financial Agent Foundation
- M16 — V1.1 Integration, QA & Production Hardening

## 30-40. Master Plan Operational Rules
- Implementation prompts must be derived from this Master Plan.
- Antigravity must operate milestone-by-milestone.
