-- Migration: Budgets and Category Allocations Schema with RLS and Validation Triggers

-- =========================================================================
-- 1. Create Tables
-- =========================================================================

-- Budgets Table
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CONSTRAINT check_budget_name CHECK (length(trim(name)) > 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_limit DECIMAL(20, 2) NOT NULL DEFAULT 0.00 CONSTRAINT check_total_limit CHECK (total_limit >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'INR' CONSTRAINT check_currency CHECK (length(currency) = 3),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_budget_dates CHECK (end_date >= start_date)
);

-- Budget Categories Table (Allocation overrides)
CREATE TABLE IF NOT EXISTS public.budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  allocated_amount DECIMAL(20, 2) NOT NULL CONSTRAINT check_allocated_amount CHECK (allocated_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_budget_category UNIQUE (budget_id, category_id)
);

-- =========================================================================
-- 2. Foreign Key Performance Indexes
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_categories_budget_id ON public.budget_categories(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_categories_category_id ON public.budget_categories(category_id);

-- =========================================================================
-- 3. Row-Level Security (RLS) Configuration
-- =========================================================================

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;

-- Budgets RLS Policies
CREATE POLICY budgets_select ON public.budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY budgets_insert ON public.budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY budgets_update ON public.budgets
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY budgets_delete ON public.budgets
  FOR DELETE USING (auth.uid() = user_id);

-- Budget Categories RLS Policies
CREATE POLICY budget_categories_select ON public.budget_categories
  FOR SELECT USING (
    budget_id IN (SELECT id FROM public.budgets WHERE user_id = auth.uid())
  );

CREATE POLICY budget_categories_insert ON public.budget_categories
  FOR INSERT WITH CHECK (
    budget_id IN (SELECT id FROM public.budgets WHERE user_id = auth.uid())
  );

CREATE POLICY budget_categories_update ON public.budget_categories
  FOR UPDATE USING (
    budget_id IN (SELECT id FROM public.budgets WHERE user_id = auth.uid())
  ) WITH CHECK (
    budget_id IN (SELECT id FROM public.budgets WHERE user_id = auth.uid())
  );

CREATE POLICY budget_categories_delete ON public.budget_categories
  FOR DELETE USING (
    budget_id IN (SELECT id FROM public.budgets WHERE user_id = auth.uid())
  );

-- =========================================================================
-- 4. Validation Triggers and Functions
-- =========================================================================

-- Trigger to validate category ownership and ensure it is an expense category
CREATE OR REPLACE FUNCTION public.validate_budget_category_assignment()
RETURNS TRIGGER AS $$
DECLARE
  b_owner UUID;
  cat_type TEXT;
  cat_owner UUID;
BEGIN
  -- 1. Get budget owner
  SELECT user_id INTO b_owner FROM public.budgets WHERE id = NEW.budget_id;
  IF b_owner IS NULL THEN
    RAISE EXCEPTION 'Associated budget does not exist';
  END IF;

  -- 2. Get category details
  SELECT transaction_type, user_id INTO cat_type, cat_owner FROM public.categories WHERE id = NEW.category_id;
  IF cat_type IS NULL THEN
    RAISE EXCEPTION 'Associated category does not exist';
  END IF;

  -- 3. Verify category belongs to user or is system defined
  IF cat_owner IS NOT NULL AND cat_owner <> b_owner THEN
    RAISE EXCEPTION 'Category must belong to the budget owner or be a system category';
  END IF;

  -- 4. Enforce that only expense categories can be budgeted
  IF cat_type <> 'expense' THEN
    RAISE EXCEPTION 'Only expense categories can be allocated to a spending budget';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_budget_category
  BEFORE INSERT OR UPDATE ON public.budget_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_budget_category_assignment();


-- Trigger to enforce that sum of category allocations does not exceed total budget limit
CREATE OR REPLACE FUNCTION public.validate_allocation_totals()
RETURNS TRIGGER AS $$
DECLARE
  b_limit DECIMAL(20, 2);
  allocated_sum DECIMAL(20, 2);
BEGIN
  -- Get overall limit
  SELECT total_limit INTO b_limit FROM public.budgets WHERE id = NEW.budget_id;
  IF b_limit IS NULL THEN
    RAISE EXCEPTION 'Associated budget does not exist';
  END IF;

  -- Sum other allocations
  SELECT COALESCE(SUM(allocated_amount), 0) INTO allocated_sum
  FROM public.budget_categories
  WHERE budget_id = NEW.budget_id AND id <> NEW.id;

  -- Verify new total doesn't exceed budget limit
  IF (allocated_sum + NEW.allocated_amount) > b_limit THEN
    RAISE EXCEPTION 'Total allocated category amounts (%%) cannot exceed the overall budget limit (%%)', (allocated_sum + NEW.allocated_amount), b_limit;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_allocation_totals
  BEFORE INSERT OR UPDATE ON public.budget_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_allocation_totals();


-- Trigger to enforce only one active monthly budget per user, currency, and date range
CREATE OR REPLACE FUNCTION public.prevent_overlapping_active_budgets()
RETURNS TRIGGER AS $$
DECLARE
  overlap_count INT;
BEGIN
  IF NEW.is_active = TRUE THEN
    SELECT COUNT(*) INTO overlap_count
    FROM public.budgets
    WHERE user_id = NEW.user_id
      AND currency = NEW.currency
      AND is_active = TRUE
      AND id <> NEW.id
      -- Overlap checking logic: (start1 <= end2) AND (end1 >= start2)
      AND (start_date <= NEW.end_date)
      AND (end_date >= NEW.start_date);

    IF overlap_count > 0 THEN
      RAISE EXCEPTION 'An active budget already exists for this currency and overlapping date range';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_overlapping_active_budgets
  BEFORE INSERT OR UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_overlapping_active_budgets();


-- =========================================================================
-- 5. updated_at Automatic Binding
-- =========================================================================

CREATE TRIGGER trg_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER trg_budget_categories_updated_at
  BEFORE UPDATE ON public.budget_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();
