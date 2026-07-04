// TypeScript Domain Types for PFM Financial Ledger Engine

export type AccountType =
  | 'cash'
  | 'checking'
  | 'savings'
  | 'credit_card'
  | 'loan'
  | 'investment'
  | 'other'

export interface Account {
  id: string
  user_id: string
  name: string
  account_type: AccountType
  currency_code: string
  opening_balance: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CategoryType = 'income' | 'expense'

export interface Category {
  id: string
  user_id: string | null
  name: string
  transaction_type: CategoryType
  icon: string | null
  is_system: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export type TransactionType = 'income' | 'expense' | 'transfer'

export interface Transaction {
  id: string
  user_id: string
  transaction_type: TransactionType
  amount: number
  account_id: string
  category_id: string | null
  transfer_to_account_id: string | null
  transaction_date: string // YYYY-MM-DD
  payee_or_source: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface TransactionTag {
  transaction_id: string
  tag_id: string
}

export type GoalType = 'monthly_savings' | 'financial_year' | 'personal'
export type GoalStatus = 'active' | 'completed' | 'paused' | 'archived'

export interface Goal {
  id: string
  user_id: string
  name: string
  goal_type: GoalType
  target_amount: number
  start_date: string // YYYY-MM-DD
  target_date: string // YYYY-MM-DD
  status: GoalStatus
  created_at: string
  updated_at: string
}

export interface GoalContribution {
  id: string
  user_id: string
  goal_id: string
  amount: number
  contribution_date: string // YYYY-MM-DD
  notes: string | null
  created_at: string
}

// Summary Types
export interface AccountBalanceSummary {
  [accountId: string]: number
}

export interface PeriodSummary {
  income: number
  expenses: number
  savings: number
  savingsRate: number
}

export interface CategorySummary {
  [categoryId: string]: number
}

export interface FinancialPeriod {
  start: string // YYYY-MM-DD
  end: string // YYYY-MM-DD
}
