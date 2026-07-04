-- PFM Financial Database Schema, Indexes, Triggers, and RLS Policies

-- =========================================================================
-- 1. Helper Triggers and Functions
-- =========================================================================

-- Reusable trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- 2. Table Definitions
-- =========================================================================

-- Accounts Table
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CONSTRAINT check_name_non_empty CHECK (length(trim(name)) > 0),
  account_type TEXT NOT NULL CONSTRAINT check_account_type CHECK (
    account_type IN ('cash', 'checking', 'savings', 'credit_card', 'loan', 'investment', 'other')
  ),
  currency_code VARCHAR(3) NOT NULL DEFAULT 'INR' CONSTRAINT check_currency_code_len CHECK (length(currency_code) = 3),
  opening_balance DECIMAL(20, 2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NULL, -- NULL indicates system-defined category
  name TEXT NOT NULL CONSTRAINT check_cat_name_non_empty CHECK (length(trim(name)) > 0),
  transaction_type TEXT NOT NULL CONSTRAINT check_transaction_type CHECK (
    transaction_type IN ('income', 'expense')
  ),
  icon TEXT NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Unique Constraints on Categories
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_category ON public.categories (name, transaction_type, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS unique_system_category ON public.categories (name, transaction_type) WHERE user_id IS NULL;

-- Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CONSTRAINT check_tx_type CHECK (
    transaction_type IN ('income', 'expense', 'transfer')
  ),
  amount DECIMAL(20, 2) NOT NULL CONSTRAINT check_tx_amount CHECK (amount > 0),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL NULL,
  transfer_to_account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NULL,
  transaction_date DATE NOT NULL,
  payee_or_source TEXT NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_transfer_dest_differ CHECK (
    transaction_type <> 'transfer' OR (transfer_to_account_id IS NOT NULL AND account_id <> transfer_to_account_id)
  )
);

-- Tags Table
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CONSTRAINT check_tag_name_non_empty CHECK (length(trim(name)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_tag_name UNIQUE (user_id, name)
);

-- Transaction Tags Junction Table
CREATE TABLE IF NOT EXISTS public.transaction_tags (
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (transaction_id, tag_id)
);

-- Goals Table
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CONSTRAINT check_goal_name_non_empty CHECK (length(trim(name)) > 0),
  goal_type TEXT NOT NULL CONSTRAINT check_goal_type CHECK (
    goal_type IN ('monthly_savings', 'financial_year', 'personal')
  ),
  target_amount DECIMAL(20, 2) NOT NULL CONSTRAINT check_goal_target CHECK (target_amount > 0),
  start_date DATE NOT NULL,
  target_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CONSTRAINT check_goal_status CHECK (
    status IN ('active', 'completed', 'paused', 'archived')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_target_after_start CHECK (target_date >= start_date)
);

-- Goal Contributions Table
CREATE TABLE IF NOT EXISTS public.goal_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  amount DECIMAL(20, 2) NOT NULL CONSTRAINT check_contrib_amount CHECK (amount > 0),
  contribution_date DATE NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 3. Validation Triggers
-- =========================================================================

-- Trigger to validate transaction parameters (category mismatch, ownership rules, transfers)
CREATE OR REPLACE FUNCTION public.validate_transaction_record()
RETURNS TRIGGER AS $$
DECLARE
  account_owner UUID;
  dest_account_owner UUID;
  cat_type TEXT;
  cat_owner UUID;
BEGIN
  -- 1. Verify source account exists and belongs to the transaction's user_id
  SELECT user_id INTO account_owner FROM public.accounts WHERE id = NEW.account_id;
  IF account_owner IS NULL OR account_owner <> NEW.user_id THEN
    RAISE EXCEPTION 'Source account must exist and belong to the transaction owner';
  END IF;

  -- 2. Handle type-specific validation
  IF NEW.transaction_type = 'transfer' THEN
    IF NEW.transfer_to_account_id IS NULL THEN
      RAISE EXCEPTION 'Transfer transaction requires a destination account';
    END IF;
    IF NEW.account_id = NEW.transfer_to_account_id THEN
      RAISE EXCEPTION 'Source and destination accounts must be different';
    END IF;
    IF NEW.category_id IS NOT NULL THEN
      RAISE EXCEPTION 'Transfer transactions must not have a category';
    END IF;
    
    -- Verify destination account exists and belongs to the transaction's user_id
    SELECT user_id INTO dest_account_owner FROM public.accounts WHERE id = NEW.transfer_to_account_id;
    IF dest_account_owner IS NULL OR dest_account_owner <> NEW.user_id THEN
      RAISE EXCEPTION 'Destination account must exist and belong to the transaction owner';
    END IF;

  ELSIF NEW.transaction_type = 'income' OR NEW.transaction_type = 'expense' THEN
    IF NEW.transfer_to_account_id IS NOT NULL THEN
      RAISE EXCEPTION 'Only transfers can have a destination account';
    END IF;
    
    -- Verify category matches the transaction type if category_id is provided
    IF NEW.category_id IS NOT NULL THEN
      SELECT transaction_type, user_id INTO cat_type, cat_owner FROM public.categories WHERE id = NEW.category_id;
      IF cat_type IS NULL THEN
        RAISE EXCEPTION 'Category does not exist';
      END IF;
      -- Verify category belongs to the user or is a system category (user_id IS NULL)
      IF cat_owner IS NOT NULL AND cat_owner <> NEW.user_id THEN
        RAISE EXCEPTION 'You do not have access to this custom category';
      END IF;
      -- Verify category type matches transaction type
      IF cat_type <> NEW.transaction_type THEN
        RAISE EXCEPTION 'Category type must match transaction type';
      END IF;
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid transaction type';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_transaction ON public.transactions;
CREATE TRIGGER trg_validate_transaction
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_transaction_record();

-- Trigger to validate transaction_tag ownership
CREATE OR REPLACE FUNCTION public.validate_transaction_tag_ownership()
RETURNS TRIGGER AS $$
DECLARE
  tx_owner UUID;
  tag_owner UUID;
BEGIN
  SELECT user_id INTO tx_owner FROM public.transactions WHERE id = NEW.transaction_id;
  SELECT user_id INTO tag_owner FROM public.tags WHERE id = NEW.tag_id;
  
  IF tx_owner IS NULL OR tag_owner IS NULL OR tx_owner <> tag_owner THEN
    RAISE EXCEPTION 'Transaction and Tag must belong to the same user';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_transaction_tag ON public.transaction_tags;
CREATE TRIGGER trg_validate_transaction_tag
  BEFORE INSERT OR UPDATE ON public.transaction_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_transaction_tag_ownership();

-- Trigger to validate goal contribution ownership
CREATE OR REPLACE FUNCTION public.validate_goal_contribution_ownership()
RETURNS TRIGGER AS $$
DECLARE
  goal_owner UUID;
BEGIN
  SELECT user_id INTO goal_owner FROM public.goals WHERE id = NEW.goal_id;
  IF goal_owner IS NULL OR goal_owner <> NEW.user_id THEN
    RAISE EXCEPTION 'Goal must belong to the contribution owner';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_goal_contribution ON public.goal_contributions;
CREATE TRIGGER trg_validate_goal_contribution
  BEFORE INSERT OR UPDATE ON public.goal_contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_goal_contribution_ownership();

-- =========================================================================
-- 4. updated_at Automatic Binding
-- =========================================================================

CREATE TRIGGER trg_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER trg_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- =========================================================================
-- 5. Foreign Key Performance Indexes
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_to_account_id ON public.transactions(transfer_to_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_contributions_user_id ON public.goal_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal_id ON public.goal_contributions(goal_id);

-- =========================================================================
-- 6. Row-Level Security (RLS) Configuration
-- =========================================================================

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;

-- Accounts Policies
CREATE POLICY "Users can manage their own accounts"
  ON public.accounts
  FOR ALL
  USING (auth.uid() = user_id);

-- Categories Policies
CREATE POLICY "Anyone can view system categories, users can view their custom categories"
  ON public.categories
  FOR SELECT
  USING (is_system = TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can manage their custom categories"
  ON public.categories
  FOR ALL
  USING (auth.uid() = user_id AND is_system = FALSE);

-- Transactions Policies
CREATE POLICY "Users can manage their own transactions"
  ON public.transactions
  FOR ALL
  USING (auth.uid() = user_id);

-- Tags Policies
CREATE POLICY "Users can manage their own tags"
  ON public.tags
  FOR ALL
  USING (auth.uid() = user_id);

-- Transaction Tags Policies (tied to transaction ownership)
CREATE POLICY "Users can view transaction tags for their transactions"
  ON public.transaction_tags
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.transactions t WHERE t.id = transaction_id AND t.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage transaction tags for their transactions"
  ON public.transaction_tags
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.transactions t WHERE t.id = transaction_id AND t.user_id = auth.uid()
  ));

-- Goals Policies
CREATE POLICY "Users can manage their own goals"
  ON public.goals
  FOR ALL
  USING (auth.uid() = user_id);

-- Goal Contributions Policies
CREATE POLICY "Users can manage their own contributions"
  ON public.goal_contributions
  FOR ALL
  USING (auth.uid() = user_id);
