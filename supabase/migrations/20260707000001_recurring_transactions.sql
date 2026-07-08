-- PFM Milestone 6: Recurring Transactions and Reliability Schema and Functions

-- =========================================================================
-- 1. Table Definitions
-- =========================================================================

-- Recurring Rules Table (Schedule templates)
CREATE TABLE IF NOT EXISTS public.recurring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CONSTRAINT check_rule_name CHECK (length(trim(name)) > 0),
  transaction_type TEXT NOT NULL CONSTRAINT check_rule_tx_type CHECK (transaction_type IN ('income', 'expense')),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  amount DECIMAL(20, 2) NOT NULL CONSTRAINT check_rule_amount CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'INR' CONSTRAINT check_rule_currency CHECK (length(currency) = 3),
  frequency TEXT NOT NULL CONSTRAINT check_rule_frequency CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE NULL,
  next_due_date DATE NOT NULL,
  description TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  archived_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_rule_dates CHECK (end_date IS NULL OR start_date <= end_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recurring_rules_user_id ON public.recurring_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_rules_next_due ON public.recurring_rules(next_due_date);

-- Recurring Occurrences Table (Expected instances generated from rules)
CREATE TABLE IF NOT EXISTS public.recurring_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_rule_id UUID REFERENCES public.recurring_rules(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  expected_amount DECIMAL(20, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CONSTRAINT check_occurrence_status CHECK (
    status IN ('pending', 'confirmed', 'skipped')
  ),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMPTZ NULL,
  skipped_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint ensuring only 1 occurrence per rule/date
DROP INDEX IF EXISTS public.idx_rule_due_date;
CREATE UNIQUE INDEX IF NOT EXISTS idx_rule_due_date 
ON public.recurring_occurrences (recurring_rule_id, due_date);

CREATE INDEX IF NOT EXISTS idx_recurring_occurrences_user_id ON public.recurring_occurrences(user_id);

-- Duplicate Dismissals Table (Stores user keep-both decisions for duplicate transaction pairs)
CREATE TABLE IF NOT EXISTS public.duplicate_dismissals (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tx1_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  tx2_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tx1_id, tx2_id),
  CONSTRAINT check_tx_order CHECK (tx1_id < tx2_id)
);

CREATE INDEX IF NOT EXISTS idx_duplicate_dismissals_user_id ON public.duplicate_dismissals(user_id);

-- =========================================================================
-- 2. Timestamp Trigger Setup
-- =========================================================================

DROP TRIGGER IF EXISTS set_recurring_rules_updated_at ON public.recurring_rules;
CREATE TRIGGER set_recurring_rules_updated_at
  BEFORE UPDATE ON public.recurring_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_recurring_occurrences_updated_at ON public.recurring_occurrences;
CREATE TRIGGER set_recurring_occurrences_updated_at
  BEFORE UPDATE ON public.recurring_occurrences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- =========================================================================
-- 3. Row-Level Security (RLS) Policies
-- =========================================================================

ALTER TABLE public.recurring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duplicate_dismissals ENABLE ROW LEVEL SECURITY;

-- recurring_rules Policies
DROP POLICY IF EXISTS recurring_rules_select ON public.recurring_rules;
CREATE POLICY recurring_rules_select ON public.recurring_rules
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS recurring_rules_insert ON public.recurring_rules;
CREATE POLICY recurring_rules_insert ON public.recurring_rules
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS recurring_rules_update ON public.recurring_rules;
CREATE POLICY recurring_rules_update ON public.recurring_rules
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS recurring_rules_delete ON public.recurring_rules;
CREATE POLICY recurring_rules_delete ON public.recurring_rules
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- recurring_occurrences Policies
DROP POLICY IF EXISTS recurring_occurrences_select ON public.recurring_occurrences;
CREATE POLICY recurring_occurrences_select ON public.recurring_occurrences
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS recurring_occurrences_insert ON public.recurring_occurrences;
CREATE POLICY recurring_occurrences_insert ON public.recurring_occurrences
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS recurring_occurrences_update ON public.recurring_occurrences;
CREATE POLICY recurring_occurrences_update ON public.recurring_occurrences
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS recurring_occurrences_delete ON public.recurring_occurrences;
CREATE POLICY recurring_occurrences_delete ON public.recurring_occurrences
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- duplicate_dismissals Policies
DROP POLICY IF EXISTS duplicate_dismissals_select ON public.duplicate_dismissals;
CREATE POLICY duplicate_dismissals_select ON public.duplicate_dismissals
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS duplicate_dismissals_insert ON public.duplicate_dismissals;
CREATE POLICY duplicate_dismissals_insert ON public.duplicate_dismissals
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.transactions WHERE id = tx1_id AND user_id = auth.uid()) AND
    EXISTS (SELECT 1 FROM public.transactions WHERE id = tx2_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS duplicate_dismissals_delete ON public.duplicate_dismissals;
CREATE POLICY duplicate_dismissals_delete ON public.duplicate_dismissals
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- =========================================================================
-- 4. Pure Helper Functions
-- =========================================================================

-- Deterministic Date Anchoring Calculation
CREATE OR REPLACE FUNCTION public.calculate_next_schedule_date(
  p_start_date DATE,
  p_frequency TEXT,
  p_current_date DATE
) RETURNS DATE AS $$
DECLARE
  v_next DATE;
  v_anchor_day INT;
  v_target_month DATE;
  v_target_year INT;
  v_target_month_num INT;
  v_days_in_month INT;
BEGIN
  -- Extract anchor day-of-month from the start date (Jan 31st anchor)
  v_anchor_day := EXTRACT(DAY FROM p_start_date);

  IF p_frequency = 'weekly' THEN
    RETURN p_current_date + INTERVAL '7 days';
  ELSIF p_frequency = 'monthly' THEN
    v_target_month := p_current_date + INTERVAL '1 month';
  ELSIF p_frequency = 'quarterly' THEN
    v_target_month := p_current_date + INTERVAL '3 months';
  ELSIF p_frequency = 'yearly' THEN
    v_target_month := p_current_date + INTERVAL '12 months';
  ELSE
    RAISE EXCEPTION 'Invalid frequency: %', p_frequency;
  END IF;

  v_target_year := EXTRACT(YEAR FROM v_target_month);
  v_target_month_num := EXTRACT(MONTH FROM v_target_month);

  -- Get total number of days in target month
  v_days_in_month := EXTRACT(DAY FROM (date_trunc('month', v_target_month) + INTERVAL '1 month' - INTERVAL '1 day'));

  -- Clamp anchor day to month length if month is shorter
  IF v_anchor_day > v_days_in_month THEN
    v_next := make_date(v_target_year, v_target_month_num, v_days_in_month);
  ELSE
    v_next := make_date(v_target_year, v_target_month_num, v_anchor_day);
  END IF;

  RETURN v_next;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =========================================================================
-- 5. Hardened SECURITY DEFINER RPC Workers
-- =========================================================================

-- Idempotent Occurrence Generator (locks rows to serialize execution)
CREATE OR REPLACE FUNCTION public.generate_recurring_occurrences(p_horizon_date DATE)
RETURNS VOID AS $$
DECLARE
  v_rule RECORD;
  v_current_date DATE;
  v_next_date DATE;
BEGIN
  -- 1. Check user authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- 2. Obtain row locks on user's active recurring rules to prevent concurrent generations
  FOR v_rule IN 
    SELECT * FROM public.recurring_rules 
    WHERE user_id = auth.uid() 
      AND is_active = TRUE 
      AND archived_at IS NULL 
      AND start_date <= p_horizon_date
    FOR UPDATE
  LOOP
    v_current_date := v_rule.next_due_date;
    
    WHILE v_current_date <= p_horizon_date AND (v_rule.end_date IS NULL OR v_current_date <= v_rule.end_date) LOOP
      -- 3. Idempotently insert unconfirmed occurrence
      INSERT INTO public.recurring_occurrences (
        recurring_rule_id,
        user_id,
        due_date,
        expected_amount,
        status
      ) VALUES (
        v_rule.id,
        auth.uid(),
        v_current_date,
        v_rule.amount,
        'pending'
      ) ON CONFLICT (recurring_rule_id, due_date) DO NOTHING;

      -- 4. Progress calendar schedule
      v_next_date := public.calculate_next_schedule_date(
        v_rule.start_date,
        v_rule.frequency,
        v_current_date
      );
      
      -- Safeguard against infinite loop or stall
      IF v_next_date <= v_current_date THEN
        v_next_date := v_current_date + INTERVAL '1 day';
      END IF;
      
      v_current_date := v_next_date;
    END LOOP;

    -- 5. Progress rule next_due_date
    UPDATE public.recurring_rules 
    SET next_due_date = v_current_date,
        updated_at = NOW()
    WHERE id = v_rule.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.generate_recurring_occurrences(DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_recurring_occurrences(DATE) TO authenticated;

-- Atomic Recurring Transaction Confirmation RPC
CREATE OR REPLACE FUNCTION public.confirm_recurring_occurrence(p_occurrence_id UUID)
RETURNS public.transactions AS $$
DECLARE
  v_occurrence public.recurring_occurrences%ROWTYPE;
  v_rule public.recurring_rules%ROWTYPE;
  v_account public.accounts%ROWTYPE;
  v_category public.categories%ROWTYPE;
  v_tx public.transactions%ROWTYPE;
BEGIN
  -- 1. Check user authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- 2. Lock and retrieve occurrence
  SELECT * INTO v_occurrence 
  FROM public.recurring_occurrences 
  WHERE id = p_occurrence_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Occurrence not found';
  END IF;

  -- 3. Verify occurrence ownership and pending status
  IF v_occurrence.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized occurrence access';
  END IF;
  
  IF v_occurrence.status <> 'pending' THEN
    -- If already confirmed, return the associated transaction record safely (idempotent duplicate prevention)
    IF v_occurrence.status = 'confirmed' AND v_occurrence.transaction_id IS NOT NULL THEN
      SELECT * INTO v_tx FROM public.transactions WHERE id = v_occurrence.transaction_id;
      RETURN v_tx;
    END IF;
    RAISE EXCEPTION 'Occurrence is not pending';
  END IF;

  -- 4. Load and verify associated rule
  SELECT * INTO v_rule 
  FROM public.recurring_rules 
  WHERE id = v_occurrence.recurring_rule_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Associated rule not found';
  END IF;

  IF v_rule.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized rule access';
  END IF;

  -- 5. Verify account ownership
  SELECT * INTO v_account FROM public.accounts WHERE id = v_rule.account_id;
  IF NOT FOUND OR v_account.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Invalid account selection';
  END IF;

  -- 6. Verify currency consistency
  IF v_account.currency_code <> v_rule.currency THEN
    RAISE EXCEPTION 'Currency mismatch between account and rule';
  END IF;

  -- 7. Verify category ownership and compatibility if set
  IF v_rule.category_id IS NOT NULL THEN
    SELECT * INTO v_category FROM public.categories WHERE id = v_rule.category_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Category not found';
    END IF;
    -- Category must be owned by the user or be a system category
    IF v_category.user_id IS NOT NULL AND v_category.user_id <> auth.uid() THEN
      RAISE EXCEPTION 'Unauthorized category access';
    END IF;
    IF v_category.transaction_type <> v_rule.transaction_type THEN
      RAISE EXCEPTION 'Category type mismatch with rule';
    END IF;
  END IF;

  -- 8. Create financial transaction record
  INSERT INTO public.transactions (
    user_id,
    transaction_type,
    amount,
    account_id,
    category_id,
    transaction_date,
    payee_or_source,
    notes
  ) VALUES (
    auth.uid(),
    v_rule.transaction_type,
    v_occurrence.expected_amount,
    v_rule.account_id,
    v_rule.category_id,
    v_occurrence.due_date,
    v_rule.name,
    COALESCE(v_rule.description, 'Recurring transaction')
  ) RETURNING * INTO v_tx;

  -- 9. Mark occurrence confirmed
  UPDATE public.recurring_occurrences SET
    status = 'confirmed',
    transaction_id = v_tx.id,
    confirmed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_occurrence_id;

  RETURN v_tx;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.confirm_recurring_occurrence(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_recurring_occurrence(UUID) TO authenticated;
