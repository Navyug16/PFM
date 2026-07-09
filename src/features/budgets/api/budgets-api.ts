import { supabase } from '@/lib/supabase'
import type { Budget, BudgetCategory, BudgetWithAllocations, BudgetAllocationWithDetails } from '../types'

interface DBAllocation {
  id: string
  budget_id: string
  category_id: string
  allocated_amount: number | string
  created_at: string
  updated_at: string
  categories: {
    name: string
    icon: string | null
  } | null
}

// Securely fetch authenticated user's ID
const getUserId = async (): Promise<string> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user.id
}

// 1. List all budgets for user
export const listBudgets = async (): Promise<Budget[]> => {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .order('start_date', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

// 2. Fetch the current active budget with category allocations joined with category details
export const getActiveBudget = async (): Promise<BudgetWithAllocations | null> => {
  // Get active budget
  const { data: budget, error: budgetError } = await supabase
    .from('budgets')
    .select('*')
    .eq('is_active', true)
    .maybeSingle()

  if (budgetError) throw new Error(budgetError.message)
  if (!budget) return null

  // Fetch category allocations with name and icon details
  const { data: allocations, error: allocError } = await supabase
    .from('budget_categories')
    .select(`
      id,
      budget_id,
      category_id,
      allocated_amount,
      created_at,
      updated_at,
      categories (
        name,
        icon
      )
    `)
    .eq('budget_id', budget.id)

  if (allocError) throw new Error(allocError.message)



  const formattedAllocations: BudgetAllocationWithDetails[] = (
    (allocations as unknown as DBAllocation[]) || []
  ).map((alloc) => ({
    id: alloc.id,
    budget_id: alloc.budget_id,
    category_id: alloc.category_id,
    allocated_amount: Number(alloc.allocated_amount),
    created_at: alloc.created_at,
    updated_at: alloc.updated_at,
    category_name: alloc.categories?.name,
    category_icon: alloc.categories?.icon || undefined,
  }))

  return {
    ...budget,
    total_limit: Number(budget.total_limit),
    allocations: formattedAllocations,
  }
}

// 3. Create a new budget with allocations
export const createBudget = async (
  budget: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  allocations: Omit<BudgetCategory, 'id' | 'budget_id' | 'created_at' | 'updated_at'>[]
): Promise<BudgetWithAllocations> => {
  const userId = await getUserId()

  // Start by creating the budget
  const { data: newBudget, error: budgetError } = await supabase
    .from('budgets')
    .insert([{ ...budget, user_id: userId, is_active: true }])
    .select()
    .single()

  if (budgetError) throw new Error(budgetError.message)

  // Insert allocations if provided
  if (allocations.length > 0) {
    const allocationsToInsert = allocations.map((alloc) => ({
      budget_id: newBudget.id,
      category_id: alloc.category_id,
      allocated_amount: alloc.allocated_amount,
    }))

    const { error: allocError } = await supabase
      .from('budget_categories')
      .insert(allocationsToInsert)

    if (allocError) {
      // Clean up budget to maintain transactional consistency on failure
      await supabase.from('budgets').delete().eq('id', newBudget.id)
      throw new Error(allocError.message)
    }
  }

  const fullBudget = await getActiveBudget()
  if (!fullBudget || fullBudget.id !== newBudget.id) {
    // If not active (e.g. past dates), fetch single
    return {
      ...newBudget,
      total_limit: Number(newBudget.total_limit),
      allocations: [],
    }
  }
  return fullBudget
}

// 4. Update an existing budget and recreate its allocations
export const updateBudget = async (
  id: string,
  budget: Partial<Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>>,
  allocations?: Omit<BudgetCategory, 'id' | 'budget_id' | 'created_at' | 'updated_at'>[]
): Promise<BudgetWithAllocations> => {
  // Update main budget record
  const { data: updatedBudget, error: budgetError } = await supabase
    .from('budgets')
    .update(budget)
    .eq('id', id)
    .select()
    .single()

  if (budgetError) throw new Error(budgetError.message)

  if (allocations !== undefined) {
    // 1. Delete existing allocations
    const { error: deleteError } = await supabase
      .from('budget_categories')
      .delete()
      .eq('budget_id', id)

    if (deleteError) throw new Error(deleteError.message)

    // 2. Insert new allocations
    if (allocations.length > 0) {
      const allocationsToInsert = allocations.map((alloc) => ({
        budget_id: id,
        category_id: alloc.category_id,
        allocated_amount: alloc.allocated_amount,
      }))

      const { error: insertError } = await supabase
        .from('budget_categories')
        .insert(allocationsToInsert)

      if (insertError) throw new Error(insertError.message)
    }
  }

  // Return refreshed budget details
  const active = await getActiveBudget()
  if (active && active.id === id) {
    return active
  }

  // Fallback if the edited budget is archived or inactive
  const { data: refreshedAllocations, error: allocError } = await supabase
    .from('budget_categories')
    .select(`
      id,
      budget_id,
      category_id,
      allocated_amount,
      created_at,
      updated_at,
      categories (
        name,
        icon
      )
    `)
    .eq('budget_id', id)

  if (allocError) throw new Error(allocError.message)

  const formatted: BudgetAllocationWithDetails[] = (
    (refreshedAllocations as unknown as DBAllocation[]) || []
  ).map((alloc) => ({
    id: alloc.id,
    budget_id: alloc.budget_id,
    category_id: alloc.category_id,
    allocated_amount: Number(alloc.allocated_amount),
    created_at: alloc.created_at,
    updated_at: alloc.updated_at,
    category_name: alloc.categories?.name,
    category_icon: alloc.categories?.icon || undefined,
  }))

  return {
    ...updatedBudget,
    total_limit: Number(updatedBudget.total_limit),
    allocations: formatted,
  }
}

// 5. Archive a budget (deactivate it)
export const archiveBudget = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('budgets')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// 6. Permanently delete a budget
export const deleteBudget = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}
