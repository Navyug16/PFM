import type { AuthError } from '@supabase/supabase-js'

/**
 * Maps Supabase Auth errors and string messages to friendly, beginner-readable notices.
 */
export const getFriendlyAuthError = (error: AuthError | string | null): string => {
  if (!error) return ''

  const message = typeof error === 'string' ? error : error.message

  // Common authentication error codes and message patterns
  if (
    message.includes('Invalid login credentials') ||
    message.includes('invalid_credentials')
  ) {
    return 'Invalid email or password.'
  }
  if (message.includes('Email not confirmed') || message.includes('Email link is invalid')) {
    return 'Please verify your email address before signing in.'
  }
  if (
    message.includes('User already registered') ||
    message.includes('Email already in use') ||
    message.includes('already exists')
  ) {
    return 'This email is already registered.'
  }
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return 'Too many requests. Please wait a few minutes and try again.'
  }
  if (
    message.includes('expired') ||
    message.includes('invalid or expired') ||
    message.includes('token')
  ) {
    return 'Your reset link is invalid or has expired.'
  }
  if (message.includes('network') || message.includes('Failed to fetch')) {
    return 'Unable to connect. Check your internet connection and try again.'
  }

  return message || 'Something went wrong. Please try again.'
}
