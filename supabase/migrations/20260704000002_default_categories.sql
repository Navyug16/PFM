-- PFM Default Categories Seeding Migration (Idempotent)

INSERT INTO public.categories (name, transaction_type, is_system, is_active) VALUES
  -- Income Categories
  ('Salary', 'income', TRUE, TRUE),
  ('Freelance', 'income', TRUE, TRUE),
  ('Business', 'income', TRUE, TRUE),
  ('Bonus', 'income', TRUE, TRUE),
  ('Interest', 'income', TRUE, TRUE),
  ('Refund', 'income', TRUE, TRUE),
  ('Gift Received', 'income', TRUE, TRUE),
  ('Other Income', 'income', TRUE, TRUE),

  -- Expense Categories
  ('Food & Dining', 'expense', TRUE, TRUE),
  ('Groceries', 'expense', TRUE, TRUE),
  ('Housing', 'expense', TRUE, TRUE),
  ('Utilities', 'expense', TRUE, TRUE),
  ('Transportation', 'expense', TRUE, TRUE),
  ('Shopping', 'expense', TRUE, TRUE),
  ('Health', 'expense', TRUE, TRUE),
  ('Education', 'expense', TRUE, TRUE),
  ('Entertainment', 'expense', TRUE, TRUE),
  ('Family', 'expense', TRUE, TRUE),
  ('Travel', 'expense', TRUE, TRUE),
  ('Subscriptions', 'expense', TRUE, TRUE),
  ('Personal Care', 'expense', TRUE, TRUE),
  ('Gifts & Donations', 'expense', TRUE, TRUE),
  ('Taxes & Fees', 'expense', TRUE, TRUE),
  ('Other Expense', 'expense', TRUE, TRUE)
ON CONFLICT (name, transaction_type) WHERE user_id IS NULL DO NOTHING;
