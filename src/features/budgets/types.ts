export interface Budget {
  id: string
  user_id: string
  name: string
  start_date: string
  end_date: string
  total_limit: number
  currency: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BudgetCategory {
  id: string
  budget_id: string
  category_id: string
  allocated_amount: number
  created_at: string
  updated_at: string
}

export interface BudgetAllocationWithDetails extends BudgetCategory {
  category_name?: string
  category_icon?: string
}

export interface BudgetWithAllocations extends Budget {
  allocations: BudgetAllocationWithDetails[]
}
