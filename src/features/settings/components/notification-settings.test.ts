import { describe, test, expect } from 'vitest'
import { canSendWeekly, canSendMonthly } from '../utils/consent-evaluator'

describe('M14 Phase 2 — Email Consent & Notification Preference Matrix', () => {
  test('1. OFF / OFF / OFF -> Master OFF, child OFF: No emails sent', () => {
    const profile = {
      email_notifications_enabled: false,
      weekly_summary_enabled: false,
      monthly_report_enabled: false,
    }
    expect(canSendWeekly(profile)).toBe(false)
    expect(canSendMonthly(profile)).toBe(false)
  })

  test('2. OFF / ON / ON -> Master OFF overrides child ON: No emails sent', () => {
    const profile = {
      email_notifications_enabled: false,
      weekly_summary_enabled: true,
      monthly_report_enabled: true,
    }
    expect(canSendWeekly(profile)).toBe(false)
    expect(canSendMonthly(profile)).toBe(false)
  })

  test('3. ON / OFF / OFF -> Master ON, both child OFF: No emails sent', () => {
    const profile = {
      email_notifications_enabled: true,
      weekly_summary_enabled: false,
      monthly_report_enabled: false,
    }
    expect(canSendWeekly(profile)).toBe(false)
    expect(canSendMonthly(profile)).toBe(false)
  })

  test('4. ON / ON / OFF -> Master ON, Weekly ON, Monthly OFF: Weekly sent, Monthly blocked', () => {
    const profile = {
      email_notifications_enabled: true,
      weekly_summary_enabled: true,
      monthly_report_enabled: false,
    }
    expect(canSendWeekly(profile)).toBe(true)
    expect(canSendMonthly(profile)).toBe(false)
  })

  test('5. ON / OFF / ON -> Master ON, Weekly OFF, Monthly ON: Weekly blocked, Monthly sent', () => {
    const profile = {
      email_notifications_enabled: true,
      weekly_summary_enabled: false,
      monthly_report_enabled: true,
    }
    expect(canSendWeekly(profile)).toBe(false)
    expect(canSendMonthly(profile)).toBe(true)
  })

  test('6. ON / ON / ON -> Master ON, both child ON: Both emails sent', () => {
    const profile = {
      email_notifications_enabled: true,
      weekly_summary_enabled: true,
      monthly_report_enabled: true,
    }
    expect(canSendWeekly(profile)).toBe(true)
    expect(canSendMonthly(profile)).toBe(true)
  })

  test('7. Null or undefined profile -> Safe fallback to false', () => {
    expect(canSendWeekly(null)).toBe(false)
    expect(canSendMonthly(null)).toBe(false)
    expect(canSendWeekly(undefined)).toBe(false)
    expect(canSendMonthly(undefined)).toBe(false)
  })
})
