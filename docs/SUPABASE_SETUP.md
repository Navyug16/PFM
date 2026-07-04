# PFM Supabase Project & Security Setup Guide

This document provides step-by-step instructions to configure and secure your Supabase database and authentication settings for the Personal Finance Manager (PFM) application.

---

## 1. Creating a Supabase Project

1. Navigate to [Supabase](https://supabase.com) and sign in or create an account.
2. In the dashboard, click **New Project**.
3. Select an organization, then configure:
   - **Name**: e.g., `PFM-App`
   - **Database Password**: Generate and store this password in a secure password manager.
   - **Region**: Choose a region closest to your users (e.g., `South Asia (Mumbai)` or `West US`).
4. Click **Create new project** and wait a few minutes for the database provisioning to complete.

---

## 2. API Credentials & Environment Configuration

### Finding Credentials
Once the project is created:
1. Go to **Project Settings** (the gear icon on the left sidebar) > **API**.
2. Locate the following keys under **Project API Keys**:
   - **Project URL**: Under the URL label (e.g., `https://xxxxxx.supabase.co`).
   - **anon public**: The browser-safe anonymous client key (e.g., `eyJhbGci...`).
   - *CRITICAL WARNING*: Do **NOT** copy or expose the `service_role` key. This key bypasses Row-Level Security and must never be placed in frontend code or shared.

### Setting local environment variables
1. In the root of your local PFM directory, copy the template `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in the values:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
   ```

### Vite Prefix Requirements
Vite only exposes environment variables prefixed with `VITE_` to your client application. Any variable without the `VITE_` prefix (e.g. `SUPABASE_SERVICE_ROLE`) remains strictly hidden from the browser for security.

---

## 3. Configuring Authentication Settings

1. Go to **Authentication** (the user icon on the left sidebar) > **Providers**.
2. Expand the **Email** provider:
   - **Enable Email Provider**: `ON`
   - **Confirm email**:
     - **Enabled (ON - Case B)**: Users must verify their email before logging in. PFM shows a "Check your email" screen.
     - **Disabled (OFF - Case A)**: Users can log in immediately upon signup without verifying their inbox.
3. In **Authentication** > **URL Configuration**:
   - **Site URL**: The primary deployment URL. During development, set this to:
     `http://localhost:5173`
   - **Redirect URLs**: Add a path for password reset actions:
     `http://localhost:5173/reset-password`
     *(When deploying PFM to production later, update the Site URL and add your production domain to the Redirect URLs list).*

---

## 4. Running SQL Scripts & Creating Schema

To initialize the database schema, trigger functions, security policies, and default categories, run the following SQL scripts in order:

### Order of Execution:
1. **Initial Profiles**: Open [setup.sql](file:///e:/PFM/supabase/setup.sql), copy its contents, paste them into the SQL Editor, and click **Run**.
2. **Financial Foundation Schema**: Open [20260704000001_financial_foundation.sql](file:///e:/PFM/supabase/migrations/20260704000001_financial_foundation.sql), copy its contents, paste them into a new SQL Editor query, and click **Run**.
3. **Default Categories Seed**: Open [20260704000002_default_categories.sql](file:///e:/PFM/supabase/migrations/20260704000002_default_categories.sql), copy its contents, paste them into a new query, and click **Run**.

*Verify that each query output states `Success` or shows that tables and policies were created successfully.*

---

## 5. Security & Row-Level Security (RLS)

### What is Row-Level Security (RLS)?
By default, database tables in PostgreSQL are open to queries if a connection is established. Row-Level Security (RLS) is an authorization layer built directly into the database engine. It checks the identity of the user executing a query (using `auth.uid()`) and determines exactly which rows they are allowed to `SELECT`, `INSERT`, `UPDATE`, or `DELETE`.

### Why PFM Needs RLS
PFM holds sensitive personal financial information. It is critical that:
- User A cannot view User B's profiles, transactions, or bank accounts.
- We never trust the client-side code as our only security check.

### Why Route Guards are NOT Database Security
React route guards (like `<ProtectedRoute>`) are only UI conveniences. They prevent casual navigation, but anyone with a browser console can modify the Javascript memory state or make direct HTTPS requests to Supabase APIs. **The database itself must protect the data.** RLS policies run on the server side and guarantee that no one can read or alter another user's records.

### Configured Policies on the `profiles` Table
Every query targeting the `profiles` table is filtered by these server-enforced rules:
1. **"Users can view their own profile"** (`SELECT`):
   - Definition: `auth.uid() = id`
   - Outcome: A logged-in user can only read their own profile row.
2. **"Users can update their own profile"** (`UPDATE`):
   - Definition: `auth.uid() = id`
   - Outcome: A user can only change their own profile fields.
3. **Trigger-based `INSERT`**:
   - Profile rows are inserted automatically by the Postgres database using a trigger function configured as `SECURITY DEFINER` (running as the database owner). No client-side INSERT policy is created, meaning users cannot arbitrarily create profile records.

---

## 6. How to Verify Everything is Working

### Profiles Verification
1. **Verify Profiles trigger**: Sign up a new user via the app's `/signup` page. Then check the **Table Editor** > `profiles` table. You should see a row automatically created with the correct `id` and `display_name`.
2. **Verify Profiles RLS policies**: Try to retrieve profiles from the browser console using the Supabase client without logging in; it will return an empty array.
3. **Verify Password Reset**: Go to `/forgot-password`, input your email, click send, and verify that you receive an email link that takes you to `/reset-password` allowing credentials update.

### Financial Foundation Verification
1. **Verify Trigger Constraints**: Try to log a transaction of type `transfer` where `account_id` and `transfer_to_account_id` are identical or category type is mismatched. Verify that the database throws a SQL exception and prevents the write.
2. **Verify Two-User RLS Isolation**:
   - Log in with User A and create an account named "User A Checking".
   - Log in with User B in a separate incognito window. Verify that "User A Checking" is not visible in User B's accounts list.
   - Run a raw SQL select from the Supabase Dashboard: `SELECT * FROM public.accounts;` (this bypasses RLS in the dashboard as it runs as owner). You will see both accounts.
   - Run the same select query through the API client using User B's credentials: it will only return User B's accounts, proving the RLS policies are active and correctly separating user datasets.
3. **Verify Tag & Goal Ownership Triggers**: Try to insert a row in `transaction_tags` linking User A's transaction to User B's tag. Verify that the trigger `validate_transaction_tag_ownership` blocks the insertion.
4. **Verify Category Deletion Safety**: Try to delete a custom category that has transactions logged under it. Verify that the system blocks the deletion, forcing archiving (`is_active = false`) instead.

---

## 7. Common Setup Mistakes

- **Exposing the `service_role` key**: Never paste the service role key anywhere in the frontend code. This key bypasses RLS policies entirely.
- **Forgetting Redirect URLs**: If the redirect URL (e.g. `http://localhost:5173/reset-password`) is not added to the Supabase URL Configuration, reset password emails will redirect to the Site URL default root instead of the password update form.
- **Omitting RLS**: If you create a new database table and forget to run `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`, the table is completely unprotected and any user can query or delete all records.
