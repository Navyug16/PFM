import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const hasCredentials = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://supabase.com/dashboard/project/brqjvepcdmnvwutyrwuz' &&
  supabaseAnonKey !== 'sb_publishable_F6UJQkSA6MYEpKEUCIFVog_PpIK0tBQ'
)

if (!hasCredentials) {
  console.warn(
    'Supabase credentials are not configured. Supabase calls will fail. ' +
    'Please check your .env file and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  )
}

// Fallback to placeholder values if variables are missing to prevent application crash on boot
export const supabase = createClient(
  supabaseUrl || 'https://supabase.com/dashboard/project/brqjvepcdmnvwutyrwuz',
  supabaseAnonKey || 'sb_publishable_F6UJQkSA6MYEpKEUCIFVog_PpIK0tBQ'
)
