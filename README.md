# PFM — Personal Finance Manager

Help the user understand their money in under 60 seconds.

## Milestone 1 — Project Foundation

This is the initial foundation stage of the Personal Finance Manager (PFM) application. This milestone sets up the core architecture, routing, visual style tokens, responsive layout, Supabase client configurations, and offline checking mechanisms.

## Tech Stack
- **Core Framework**: React 19, TypeScript
- **Bundler & Tooling**: Vite 8, ESLint, Prettier
- **Client-Side Routing**: React Router v7
- **Styling & Layout**: Tailwind CSS v4, Lucide Icons
- **Data Layer Integration**: Supabase JavaScript SDK

## Requirements
- **Node.js**: v22+
- **npm**: v10+

## Setup & Installation

1. **Clone the repository** (or navigate to the workspace directory)
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Environment Setup**:
   Copy `.env.example` to `.env` and fill in your Supabase configuration:
   ```bash
   cp .env.example .env
   ```
   *Note: Placeholders are provided by default to prevent runtime bootstrap crashes if credentials are not configured yet.*

## Development Commands

- **Start Dev Server**:
  ```bash
  npm run dev
  ```
- **Build Production Bundle**:
  ```bash
  npm run build
  ```
- **Preview Production Build**:
  ```bash
  npm run preview
  ```
- **Code Linting**:
  ```bash
  npm run lint
  ```
- **TypeScript Compilation Check**:
  ```bash
  npm run typecheck
  ```
- **Prettier Code Formatting**:
  ```bash
  npm run format
  ```

## Project Directory Structure

```
src/
  app/
    App.tsx          # Main entry point mounting Router & Network Status
    router.tsx       # React Router hierarchy mapping paths to feature placeholders
  components/
    layout/
      AppShell.tsx   # Master responsive shell (Sidebar / Bottom Navigation)
      PageHeader.tsx # Styled page headers for views
      PageContainer.tsx # Responsive width-restricted content container
    ui/
      EmptyState.tsx # Reusable empty records indicator
      ErrorState.tsx # Reusable error feedback component with Retry action
      LoadingState.tsx # Reusable loader spinner
      NetworkStatus.tsx # Global online/offline network monitor banner
  features/
    auth/
      LoginPage.tsx  # Standalone login mockup
      SignupPage.tsx # Standalone signup mockup
    overview/        # Landing page placeholder
    transactions/    # Transaction log placeholder
    accounts/        # Accounts overview placeholder
    goals/           # Budgets/goals placeholder
    insights/        # Questions & analysis placeholder
    metals/          # Gold/Silver Spot price tracker placeholder
    settings/        # Profile preferences & export placeholder
  lib/
    supabase.ts      # Supabase client setup with graceful env checking
  styles/
    globals.css      # CSS entry point with Tailwind v4 & Design system color tokens
  main.tsx           # React bootstrap mount point
```

## Included in Milestone 1
- **Project Scaffold**: Clean React + Vite + strict TypeScript configurations.
- **Strict ESLint & Prettier**: Static analysis and code formatting configuration.
- **Vite Path Aliases**: Reusable `@/*` maps to the `src/*` folder.
- **Routing Engine**: Functional routing configuration for 9 application pages.
- **Premium Styling tokens**: Custom dark-graphite palette variables integrated using Tailwind CSS v4.
- **Responsive App Shell**: Sidebar for desktop and tabbed bottom navigation for mobile, featuring active path highlights and tap targets.
- **Mock Authentication Access**: Bypasses login/signup screen to review the application layouts.
- **Network Status Monitor**: Custom hook checking online status with a warning banner when offline.
- **Graceful Supabase Client**: Non-blocking client configuration logging warnings instead of crashing on boot.

## Intentionally Not Implemented Yet (Deferred to Future Milestones)
- Supabase Authentication logic & secure session management.
- PostgreSQL database schemas, indexes, and row-level security policies.
- CRUD operations for Accounts, Transactions, or Transfers.
- Goals calculations, financial period comparisons, and trend engines.
- External Precious Metals Spot price API hooks.
- PWA configurations (service workers, offline caching).
- PDF or CSV statements export.
