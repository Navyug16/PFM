-- Migration to add preferences columns to public.profiles
-- Safely creates the profiles table if not present, then adds preferences columns with CHECK constraints

-- 1. Create Profiles Table (Public Schema) if it does not exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies if they do not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile"
      ON public.profiles
      FOR SELECT
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON public.profiles
      FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END
$$;

-- 4. Add Preference Columns with Check Constraints
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system';
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS chk_theme;
ALTER TABLE public.profiles ADD CONSTRAINT chk_theme CHECK (theme IN ('light', 'dark', 'system'));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR';
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS chk_currency;
ALTER TABLE public.profiles ADD CONSTRAINT chk_currency CHECK (currency IN ('INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en-IN';
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS chk_locale;
ALTER TABLE public.profiles ADD CONSTRAINT chk_locale CHECK (locale IN ('en-IN', 'en-US', 'en-GB', 'de-DE', 'fr-FR', 'en-AE', 'en-SG'));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS week_start INT DEFAULT 1;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS chk_week_start;
ALTER TABLE public.profiles ADD CONSTRAINT chk_week_start CHECK (week_start IN (0, 1)); -- 0 = Sunday, 1 = Monday

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fy_start_month INT DEFAULT 4;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS chk_fy_start;
ALTER TABLE public.profiles ADD CONSTRAINT chk_fy_start CHECK (fy_start_month IN (1, 4)); -- 1 = January, 4 = April

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'YYYY-MM-DD';
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS chk_date_format;
ALTER TABLE public.profiles ADD CONSTRAINT chk_date_format CHECK (date_format IN ('YYYY-MM-DD', 'DD-MM-YYYY', 'MM-DD-YYYY'));

-- Backfill existing rows with defaults if any values are NULL
UPDATE public.profiles SET
  theme = COALESCE(theme, 'system'),
  currency = COALESCE(currency, 'INR'),
  locale = COALESCE(locale, 'en-IN'),
  week_start = COALESCE(week_start, 1),
  fy_start_month = COALESCE(fy_start_month, 4),
  date_format = COALESCE(date_format, 'YYYY-MM-DD')
WHERE
  theme IS NULL OR
  currency IS NULL OR
  locale IS NULL OR
  week_start IS NULL OR
  fy_start_month IS NULL OR
  date_format IS NULL;
