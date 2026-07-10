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
