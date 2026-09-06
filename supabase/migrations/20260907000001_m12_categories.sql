-- PFM M12 Category Seeding Migration (Idempotent)
-- Safely inserts default system categories matching exact system partial index:
-- CREATE UNIQUE INDEX unique_system_category ON public.categories (name, transaction_type) WHERE user_id IS NULL;

INSERT INTO public.categories (name, transaction_type, is_system, is_active, icon) VALUES
  ('Gas / Fuel', 'expense', TRUE, TRUE, 'Fuel'),
  ('Dining / Restaurants', 'expense', TRUE, TRUE, 'Utensils'),
  ('Insurance', 'expense', TRUE, TRUE, 'Shield')
ON CONFLICT (name, transaction_type) WHERE user_id IS NULL DO NOTHING;
