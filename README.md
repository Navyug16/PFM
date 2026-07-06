# PFM — Personal Finance Manager

Help the user understand their money in under 60 seconds.

## Current Milestone: Milestone 5 — Goals, Budgets & Planning Intelligence

This milestone delivers the comprehensive budgeting, spending limits, daily safe-to-spend allowance calculations, projected variance analysis, and savings goal intelligence systems.

---

## Tech Stack
- **Core Framework**: React 19, TypeScript
- **Bundler & Tooling**: Vite 8, ESLint, Prettier
- **Client-Side Routing**: React Router v7
- **Styling & Layout**: Tailwind CSS v4, Lucide Icons
- **Data Layer Integration**: Supabase JavaScript SDK
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)

---

## Getting Started

### 1. Requirements
- **Node.js**: v22+
- **npm**: v10+

### 2. Installation
```bash
npm install
```

### 3. Database Setup (SQL Script)
Before running the application, you must initialize the backend tables and triggers in your Supabase project:
1. Copy the SQL script in [setup.sql](file:///e:/PFM/supabase/setup.sql).
2. Go to your **Supabase Dashboard** > **SQL Editor** > **New Query**.
3. Paste the script and click **Run**.
4. Read the detailed [Supabase Project Setup Guide](file:///e:/PFM/docs/SUPABASE_SETUP.md) for full configuration steps.

### 4. Local Environment Setup
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
   ```

### 5. Running the Application
- **Start Dev Server**:
  ```bash
  npm run dev
  ```
- **Code Linting**:
  ```bash
  npm run lint
  ```
- **TypeScript Check**:
  ```bash
  npm run typecheck
  ```
- **Build Production Bundle**:
  ```bash
  npm run build
  ```

---

## Route Access Map

### Public Auth Routes (Accessible only by unauthenticated users)
- `/login` — Form validation, password visibility toggles, and connection check.
- `/signup` — Interactive name, email, and password registration form. Handles cases with or without email verification settings.
- `/forgot-password` — Requests recovery links using privacy-conscious confirmation copy.
- `/reset-password` — Enter and confirm new password to recover credentials.

### Protected App Routes (Accessible only by authenticated users)
- `/overview` — Primary financial overview dashboard.
- `/transactions` — Cash flow ledger entries.
- `/accounts` — Asset bank accounts.
- `/goals` — Saving goals and budgets.
- `/insights` — Smart queries.
- `/metals` — Gold & Silver tracker.
- `/settings` — Profile settings and logout.

---

## Security Model

- **Frontend Route Protection**: Unauthenticated hits to protected paths automatically redirect to `/login` preserving the initial path state. Authenticated users are prevented from returning to `/login` or `/signup` and are redirected to `/overview`.
- **Database Row-Level Security (RLS)**: Enforced on the `profiles` table in Supabase PostgreSQL. Users can select or update only the profile row matching their authenticated UUID (`auth.uid() = id`).
- **Profile Synchronization**: Handled entirely via database trigger functions (`SECURITY DEFINER`) executing on `INSERT` events in `auth.users`, ensuring profile records are created reliably on signup.

---

## Post-Completion Production Checklist

Before launching the application to real production users, make sure to configure the production email flows:
- [ ] **Verify Custom Domain in Resend**: Purchase your domain and add it under the **Domains** tab in your Resend Dashboard (configure the MX/TXT DNS records).
- [ ] **Enable Supabase Signup Email Confirmation**: In the Supabase Dashboard under **Authentication -> Providers -> Email**, turn **Confirm email** to **ON / Enabled** to require verification for new signups.
- [ ] **Update Sender Address**: In Supabase SMTP Settings, change the **Sender Email** from `onboarding@resend.dev` to your custom verified email address (e.g., `noreply@yourdomain.com`).
