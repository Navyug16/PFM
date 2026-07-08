// TypeScript types for PFM Recurring Transactions and Reliability Engine

export type FrequencyType = 'weekly' | 'monthly' | 'quarterly' | 'yearly'

export interface RecurringRule {
  id: string
  user_id: string
  name: string
  transaction_type: 'income' | 'expense'
  account_id: string
  category_id: string | null
  amount: number
  currency: string
  frequency: FrequencyType
  start_date: string // YYYY-MM-DD
  end_date: string | null // YYYY-MM-DD
  next_due_date: string // YYYY-MM-DD
  description: string | null
  is_active: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
}

export type OccurrenceStatus = 'pending' | 'confirmed' | 'skipped'

export interface RecurringOccurrence {
  id: string
  recurring_rule_id: string | null
  user_id: string
  due_date: string // YYYY-MM-DD
  expected_amount: number
  status: OccurrenceStatus
  transaction_id: string | null
  confirmed_at: string | null
  skipped_at: string | null
  created_at: string
  updated_at: string
  
  // Stored rule context (joined at query time)
  rule_name?: string
  rule_description?: string | null
  rule_type?: 'income' | 'expense'
  category_name?: string
  category_icon?: string | null
  account_name?: string
}

export interface DuplicateDismissal {
  user_id: string
  tx1_id: string
  tx2_id: string
  created_at: string
}
