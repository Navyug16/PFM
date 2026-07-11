import { supabase } from '@/lib/supabase'
import type { UserProfile } from '../types'

/**
 * Retrieves the profile row matching the authenticated user ID.
 */
export const getProfile = async (userId: string): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    throw error
  }
  return data
}

/**
 * Creates a default profile row for the authenticated user ID.
 * This is used as a fallback if the user trigger was not run or historical user lacks a profile.
 */
export const createDefaultProfile = async (userId: string, email?: string): Promise<UserProfile> => {
  const defaultDisplayName = email ? email.split('@')[0] : 'User'
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      display_name: defaultDisplayName,
      theme: 'system',
      currency: 'INR',
      locale: 'en-IN',
      week_start: 1,
      fy_start_month: 4,
      date_format: 'YYYY-MM-DD'
    })
    .select()
    .single()

  if (error) {
    throw error
  }
  return data
}

/**
 * Updates columns on the profile row for the authenticated user ID.
 */
export const updateProfile = async (
  userId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>
): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw error
  }
  return data
}
