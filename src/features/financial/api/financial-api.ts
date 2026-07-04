// Typed Data Access Layer for PFM Ledger Engine using Supabase client
import { supabase } from '@/lib/supabase'
import type {
  Account,
  Category,
  Transaction,
  Tag,
  Goal,
  GoalContribution
} from '../types'

// Helper to get authenticated user ID securely
const getUserId = async (): Promise<string> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user.id
}

// =========================================================================
// 1. Accounts API
// =========================================================================

export const listAccounts = async (): Promise<Account[]> => {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .order('name', { ascending: true })
  
  if (error) throw new Error(error.message)
  return data || []
}

export const createAccount = async (
  account: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<Account> => {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('accounts')
    .insert([{ ...account, user_id: userId }])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export const updateAccount = async (id: string, account: Partial<Account>): Promise<Account> => {
  const { data, error } = await supabase
    .from('accounts')
    .update(account)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export const archiveAccount = async (id: string): Promise<Account> => {
  return updateAccount(id, { is_active: false })
}

export const deleteAccount = async (id: string): Promise<void> => {
  // Check if account has any transaction history (as source or transfer destination)
  const { count, error: countError } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .or(`account_id.eq.${id},transfer_to_account_id.eq.${id}`)

  if (countError) throw new Error(countError.message)
  
  if (count && count > 0) {
    throw new Error('Cannot delete account with financial history. Archive it instead.')
  }

  const { error } = await supabase.from('accounts').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// =========================================================================
// 2. Categories API
// =========================================================================

export const listCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

export const listCategoriesByType = async (type: 'income' | 'expense'): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('transaction_type', type)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

export const createCustomCategory = async (
  name: string,
  type: 'income' | 'expense'
): Promise<Category> => {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name, transaction_type: type, user_id: userId, is_system: false }])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export const updateCustomCategory = async (id: string, name: string): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', id)
    .eq('is_system', false) // Protect system categories
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export const archiveCustomCategory = async (id: string): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .update({ is_active: false })
    .eq('id', id)
    .eq('is_system', false)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// =========================================================================
// 3. Transactions API
// =========================================================================

export interface TransactionFilters {
  dateFrom?: string
  dateTo?: string
  accountId?: string
  categoryId?: string
  type?: 'income' | 'expense' | 'transfer'
  search?: string
}

export const listTransactions = async (filters: TransactionFilters = {}): Promise<Transaction[]> => {
  let query = supabase.from('transactions').select('*')

  if (filters.dateFrom) {
    query = query.gte('transaction_date', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('transaction_date', filters.dateTo)
  }
  if (filters.accountId) {
    query = query.or(`account_id.eq.${filters.accountId},transfer_to_account_id.eq.${filters.accountId}`)
  }
  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId)
  }
  if (filters.type) {
    query = query.eq('transaction_type', filters.type)
  }
  if (filters.search && filters.search.trim().length > 0) {
    const searchVal = `%${filters.search}%`
    query = query.or(`payee_or_source.ilike.${searchVal},notes.ilike.${searchVal}`)
  }

  const { data, error } = await query.order('transaction_date', { ascending: false }).order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export const getTransaction = async (id: string): Promise<Transaction> => {
  const { data, error } = await supabase.from('transactions').select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  return data
}

export const createTransaction = async (
  tx: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<Transaction> => {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('transactions')
    .insert([{ ...tx, user_id: userId }])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export const updateTransaction = async (
  id: string,
  tx: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .update(tx)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export const deleteTransaction = async (id: string): Promise<void> => {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// =========================================================================
// 4. Tags API
// =========================================================================

export const listTags = async (): Promise<Tag[]> => {
  const { data, error } = await supabase.from('tags').select('*').order('name', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

export const createTag = async (name: string): Promise<Tag> => {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('tags')
    .insert([{ name, user_id: userId }])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export const attachTagToTransaction = async (
  transactionId: string,
  tagId: string
): Promise<void> => {
  const { error } = await supabase
    .from('transaction_tags')
    .insert([{ transaction_id: transactionId, tag_id: tagId }])
  if (error) throw new Error(error.message)
}

export const detachTagFromTransaction = async (
  transactionId: string,
  tagId: string
): Promise<void> => {
  const { error } = await supabase
    .from('transaction_tags')
    .delete()
    .eq('transaction_id', transactionId)
    .eq('tag_id', tagId)
  if (error) throw new Error(error.message)
}

export const deleteTag = async (id: string): Promise<void> => {
  // Junction rows are cleaned automatically via foreign key ON DELETE CASCADE.
  const { error } = await supabase.from('tags').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// =========================================================================
// 5. Goals API
// =========================================================================

export const listGoals = async (): Promise<Goal[]> => {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('target_date', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

export const getGoal = async (id: string): Promise<Goal> => {
  const { data, error } = await supabase.from('goals').select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  return data
}

export const createGoal = async (
  goal: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<Goal> => {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('goals')
    .insert([{ ...goal, user_id: userId }])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export const updateGoal = async (id: string, goal: Partial<Goal>): Promise<Goal> => {
  const { data, error } = await supabase
    .from('goals')
    .update(goal)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export const archiveGoal = async (id: string): Promise<Goal> => {
  return updateGoal(id, { status: 'archived' })
}

// =========================================================================
// 6. Goal Contributions API
// =========================================================================

export const listGoalContributions = async (goalId: string): Promise<GoalContribution[]> => {
  const { data, error } = await supabase
    .from('goal_contributions')
    .select('*')
    .eq('goal_id', goalId)
    .order('contribution_date', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export const addGoalContribution = async (
  contribution: Omit<GoalContribution, 'id' | 'user_id' | 'created_at'>
): Promise<GoalContribution> => {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('goal_contributions')
    .insert([{ ...contribution, user_id: userId }])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export const deleteGoalContribution = async (id: string): Promise<void> => {
  const { error } = await supabase.from('goal_contributions').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
