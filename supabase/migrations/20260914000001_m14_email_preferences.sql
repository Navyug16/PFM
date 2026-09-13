-- Migration to add email notification preferences to public.profiles
-- Milestone: M14 Phase 2 — Email Preferences & Consent
-- Default: Strict Opt-In (FALSE for all email preferences)

-- 1. Add Preference Columns to public.profiles if they do not exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weekly_summary_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS monthly_report_enabled BOOLEAN DEFAULT FALSE;

-- 2. Backfill any existing NULL values to FALSE
UPDATE public.profiles SET
  email_notifications_enabled = COALESCE(email_notifications_enabled, FALSE),
  weekly_summary_enabled = COALESCE(weekly_summary_enabled, FALSE),
  monthly_report_enabled = COALESCE(monthly_report_enabled, FALSE)
WHERE
  email_notifications_enabled IS NULL OR
  weekly_summary_enabled IS NULL OR
  monthly_report_enabled IS NULL;

-- 3. Enforce NOT NULL constraints after backfill
ALTER TABLE public.profiles ALTER COLUMN email_notifications_enabled SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN weekly_summary_enabled SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN monthly_report_enabled SET NOT NULL;
