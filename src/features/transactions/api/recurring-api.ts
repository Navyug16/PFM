import { supabase } from '@/lib/supabase'
import type { RecurringRule, RecurringOccurrence, DuplicateDismissal } from '../types/recurring'
import type { Transaction } from '@/features/financial/types'

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
// 1. Rules Management API
// =========================================================================

export const listRecurringRules = async (): Promise<RecurringRule[]> => {
  const { data, error } = await supabase
    .from('recurring_rules')
    .select('*')
    .is('archived_at', null)
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

export const createRecurringRule = async (
  rule: Omit<RecurringRule, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_active' | 'archived_at' | 'next_due_date'>
): Promise<RecurringRule> => {
  const userId = await getUserId()
  
  // Set next_due_date initially to start_date
  const { data, error } = await supabase
    .from('recurring_rules')
    .insert([{
      ...rule,
      user_id: userId,
      next_due_date: rule.start_date,
      is_active: true,
      archived_at: null
    }])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export const updateRecurringRule = async (
  id: string,
  updates: Partial<Omit<RecurringRule, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<RecurringRule> => {
  const { data, error } = await supabase
    .from('recurring_rules')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export const pauseRecurringRule = async (id: string): Promise<void> => {
  // 1. Mark rule inactive
  const { error: updateError } = await supabase
    .from('recurring_rules')
    .update({ is_active: false })
    .eq('id', id)
  
  if (updateError) throw new Error(updateError.message)

  // 2. Delete future unconfirmed occurrences (due_date > Today)
  const todayStr = new Date().toISOString().split('T')[0]
  const { error: deleteError } = await supabase
    .from('recurring_occurrences')
    .delete()
    .eq('recurring_rule_id', id)
    .eq('status', 'pending')
    .gt('due_date', todayStr)

  if (deleteError) throw new Error(deleteError.message)
}

export const resumeRecurringRule = async (
  id: string,
  newNextDueDate: string
): Promise<void> => {
  // Set next_due_date to next scheduled date >= Today and set active
  const { error } = await supabase
    .from('recurring_rules')
    .update({
      is_active: true,
      next_due_date: newNextDueDate
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export const archiveRecurringRule = async (id: string): Promise<void> => {
  // 1. Archive rule (set archived_at)
  const { error: updateError } = await supabase
    .from('recurring_rules')
    .update({
      is_active: false,
      archived_at: new Date().toISOString()
    })
    .eq('id', id)

  if (updateError) throw new Error(updateError.message)

  // 2. Delete future unconfirmed occurrences
  const todayStr = new Date().toISOString().split('T')[0]
  const { error: deleteError } = await supabase
    .from('recurring_occurrences')
    .delete()
    .eq('recurring_rule_id', id)
    .eq('status', 'pending')
    .gt('due_date', todayStr)

  if (deleteError) throw new Error(deleteError.message)
}

export const deleteRecurringRule = async (id: string): Promise<void> => {
  // 1. Check for confirmed history
  const { count, error: countError } = await supabase
    .from('recurring_occurrences')
    .select('*', { count: 'exact', head: true })
    .eq('recurring_rule_id', id)
    .eq('status', 'confirmed')

  if (countError) throw new Error(countError.message)
  if (count && count > 0) {
    throw new Error('Cannot delete recurring rule with confirmed payments history. Archive it instead.')
  }

  // 2. Hard delete rule (cascades pending occurrences)
  const { error } = await supabase
    .from('recurring_rules')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// =========================================================================
// 2. Generation and Confirmation API
// =========================================================================

export const generateOccurrences = async (horizonDate: string): Promise<void> => {
  const { error } = await supabase.rpc('generate_recurring_occurrences', {
    p_horizon_date: horizonDate
  })
  if (error) throw new Error(error.message)
}

export const confirmOccurrence = async (occurrenceId: string): Promise<Transaction> => {
  const { data, error } = await supabase.rpc('confirm_recurring_occurrence', {
    p_occurrence_id: occurrenceId
  })
  if (error) throw new Error(error.message)
  return data
}

export const skipOccurrence = async (occurrenceId: string): Promise<void> => {
  const { error } = await supabase
    .from('recurring_occurrences')
    .update({
      status: 'skipped',
      skipped_at: new Date().toISOString()
    })
    .eq('id', occurrenceId)
    .eq('status', 'pending')

  if (error) throw new Error(error.message)
}

export const listOccurrences = async (): Promise<RecurringOccurrence[]> => {
  // Query occurrences and join with rule metadata, accounts, and categories
  const { data, error } = await supabase
    .from('recurring_occurrences')
    .select(`
      *,
      recurring_rules (
        name,
        description,
        transaction_type,
        categories (
          name,
          icon
        ),
        accounts (
          name
        )
      )
    `)
    .order('due_date', { ascending: true })

  if (error) throw new Error(error.message)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((row: any) => ({
    id: row.id,
    recurring_rule_id: row.recurring_rule_id,
    user_id: row.user_id,
    due_date: row.due_date,
    expected_amount: Number(row.expected_amount),
    status: row.status,
    transaction_id: row.transaction_id,
    confirmed_at: row.confirmed_at,
    skipped_at: row.skipped_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    rule_name: row.recurring_rules?.name || 'Deleted Rule',
    rule_description: row.recurring_rules?.description,
    rule_type: row.recurring_rules?.transaction_type,
    category_name: row.recurring_rules?.categories?.name || 'Uncategorized',
    category_icon: row.recurring_rules?.categories?.icon,
    account_name: row.recurring_rules?.accounts?.name || 'Deleted Account'
  }))
}

// =========================================================================
// 3. Duplicate Dismissals API
// =========================================================================

export const dismissDuplicatePair = async (tx1Id: string, tx2Id: string): Promise<void> => {
  const userId = await getUserId()
  const firstId = tx1Id < tx2Id ? tx1Id : tx2Id
  const secondId = tx1Id < tx2Id ? tx2Id : tx1Id

  const { error } = await supabase
    .from('duplicate_dismissals')
    .insert([{
      user_id: userId,
      tx1_id: firstId,
      tx2_id: secondId
    }])

  if (error) throw new Error(error.message)
}

export const listDuplicateDismissals = async (): Promise<DuplicateDismissal[]> => {
  const { data, error } = await supabase
    .from('duplicate_dismissals')
    .select('*')

  if (error) throw new Error(error.message)
  return data || []
}
