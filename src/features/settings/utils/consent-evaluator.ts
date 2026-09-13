/**
 * Pure consent evaluator functions for M14 Phase 2.
 * Evaluates whether a user has opted in to receiving financial email dispatches.
 * 
 * Strict Opt-In Rules:
 * CAN_SEND_WEEKLY = email_notifications_enabled AND weekly_summary_enabled
 * CAN_SEND_MONTHLY = email_notifications_enabled AND monthly_report_enabled
 */

export interface ConsentProfile {
  email_notifications_enabled?: boolean
  weekly_summary_enabled?: boolean
  monthly_report_enabled?: boolean
}

export const canSendWeekly = (profile: ConsentProfile | null | undefined): boolean => {
  if (!profile) return false
  return Boolean(profile.email_notifications_enabled && profile.weekly_summary_enabled)
}

export const canSendMonthly = (profile: ConsentProfile | null | undefined): boolean => {
  if (!profile) return false
  return Boolean(profile.email_notifications_enabled && profile.monthly_report_enabled)
}
