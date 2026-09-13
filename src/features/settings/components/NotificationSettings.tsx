import React, { useState } from 'react'
import { useSettings } from '../hooks/useSettings'
import { Bell, Mail, Calendar, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react'

export const NotificationSettings: React.FC = () => {
  const { profile, loading, error, updateProfile } = useSettings()

  const [overrides, setOverrides] = useState<{
    email_notifications_enabled?: boolean
    weekly_summary_enabled?: boolean
    monthly_report_enabled?: boolean
  }>({})

  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const emailNotifications = overrides.email_notifications_enabled ?? profile?.email_notifications_enabled ?? false
  const weeklySummary = overrides.weekly_summary_enabled ?? profile?.weekly_summary_enabled ?? false
  const monthlyReport = overrides.monthly_report_enabled ?? profile?.monthly_report_enabled ?? false

  const handleToggle = async (key: 'email_notifications_enabled' | 'weekly_summary_enabled' | 'monthly_report_enabled', newValue: boolean) => {
    if (!profile) return

    setOverrides((prev) => ({ ...prev, [key]: newValue }))
    setSaving(true)
    setSuccessMessage(null)
    setSaveError(null)

    try {
      await updateProfile({ [key]: newValue })
      setSuccessMessage('Notification preferences updated successfully.')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: unknown) {
      console.error('Error updating notification preferences:', err)
      // Revert optimistic override on error
      setOverrides((prev) => ({ ...prev, [key]: undefined }))
      setSaveError(err instanceof Error ? err.message : 'Failed to update notification settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-text-secondary gap-2">
        <RefreshCw size={18} className="animate-spin text-brand-orange" />
        <span className="text-sm font-medium">Loading notification settings...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-state-expense/10 border border-state-expense/20 text-state-expense rounded-custom-md text-sm text-center">
        {error}
      </div>
    )
  }

  const isGlobalEnabled = emailNotifications

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-surface-primary border border-border-neutral rounded-custom-lg p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-brand-orange/10 border border-brand-orange/20 rounded-custom-md text-brand-orange shrink-0">
            <Bell size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">Email & Notification Preferences</h3>
            <p className="text-xs text-text-secondary mt-1">
              Configure scheduled financial summaries and reports delivered directly to your inbox.
            </p>
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      {saveError && (
        <div className="p-3.5 bg-state-expense/10 border border-state-expense/20 text-state-expense rounded-custom-md flex items-start gap-2.5 text-xs font-semibold">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{saveError}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-custom-md flex items-start gap-2.5 text-xs font-semibold">
          <ShieldCheck size={16} className="shrink-0 mt-0.5 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Master Gate: Global Email Notifications */}
      <div className="bg-surface-primary border border-border-neutral rounded-custom-lg p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-brand-orange" />
              <label htmlFor="global-email-toggle" className="text-sm font-extrabold text-text-primary uppercase tracking-wider cursor-pointer">
                Global Email Notifications
              </label>
            </div>
            <p className="text-xs text-text-secondary" id="global-email-desc">
              Master control for all financial email dispatches. When turned OFF, zero emails will be sent regardless of individual report toggles below.
            </p>
          </div>

          <button
            id="global-email-toggle"
            type="button"
            role="switch"
            aria-checked={emailNotifications}
            aria-describedby="global-email-desc"
            aria-label="Toggle Global Email Notifications"
            disabled={saving}
            onClick={() => handleToggle('email_notifications_enabled', !emailNotifications)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-orange/50 min-h-[44px] min-w-[44px] items-center justify-center ${
              emailNotifications ? 'bg-brand-orange' : 'bg-surface-secondary border-border-neutral'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                emailNotifications ? 'translate-x-2.5' : '-translate-x-2.5'
              }`}
            />
          </button>
        </div>

        <div className="border-t border-border-neutral/40" />

        {/* Sub-toggles Section */}
        <div className="space-y-5">
          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">
            Scheduled Report Subscriptions
          </h4>

          {/* Child Toggle 1: Weekly Summary */}
          <div className={`flex items-center justify-between gap-4 p-4 rounded-custom-md border transition-all ${
            isGlobalEnabled 
              ? 'bg-surface-secondary/40 border-border-neutral' 
              : 'bg-surface-secondary/20 border-border-neutral/40 opacity-50 cursor-not-allowed'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calendar size={15} className={isGlobalEnabled ? 'text-brand-orange' : 'text-text-muted'} />
                <label 
                  htmlFor="weekly-summary-toggle" 
                  className={`text-xs font-bold uppercase tracking-wider ${isGlobalEnabled ? 'text-text-primary cursor-pointer' : 'text-text-muted cursor-not-allowed'}`}
                >
                  Weekly Financial Summary
                </label>
              </div>
              <p className="text-[11px] text-text-secondary" id="weekly-summary-desc">
                Receive a weekly summary of your income, expenses, savings rate, and top spending category. Delivered every Monday.
              </p>
            </div>

            <button
              id="weekly-summary-toggle"
              type="button"
              role="switch"
              aria-checked={weeklySummary}
              aria-describedby="weekly-summary-desc"
              aria-label="Toggle Weekly Financial Summary"
              aria-disabled={!isGlobalEnabled}
              disabled={!isGlobalEnabled || saving}
              onClick={() => handleToggle('weekly_summary_enabled', !weeklySummary)}
              className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-orange/50 min-h-[44px] min-w-[44px] items-center justify-center ${
                !isGlobalEnabled 
                  ? 'cursor-not-allowed bg-surface-secondary border-border-neutral' 
                  : weeklySummary 
                    ? 'bg-brand-orange cursor-pointer' 
                    : 'bg-surface-secondary border-border-neutral cursor-pointer'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  weeklySummary ? 'translate-x-2.5' : '-translate-x-2.5'
                }`}
              />
            </button>
          </div>

          {/* Child Toggle 2: Monthly Report */}
          <div className={`flex items-center justify-between gap-4 p-4 rounded-custom-md border transition-all ${
            isGlobalEnabled 
              ? 'bg-surface-secondary/40 border-border-neutral' 
              : 'bg-surface-secondary/20 border-border-neutral/40 opacity-50 cursor-not-allowed'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calendar size={15} className={isGlobalEnabled ? 'text-brand-orange' : 'text-text-muted'} />
                <label 
                  htmlFor="monthly-report-toggle" 
                  className={`text-xs font-bold uppercase tracking-wider ${isGlobalEnabled ? 'text-text-primary cursor-pointer' : 'text-text-muted cursor-not-allowed'}`}
                >
                  Monthly Financial Report
                </label>
              </div>
              <p className="text-[11px] text-text-secondary" id="monthly-report-desc">
                Receive an end-of-month breakdown of monthly cash flow, category spending, budget performance, and progress insights. Delivered on the 1st of every month.
              </p>
            </div>

            <button
              id="monthly-report-toggle"
              type="button"
              role="switch"
              aria-checked={monthlyReport}
              aria-describedby="monthly-report-desc"
              aria-label="Toggle Monthly Financial Report"
              aria-disabled={!isGlobalEnabled}
              disabled={!isGlobalEnabled || saving}
              onClick={() => handleToggle('monthly_report_enabled', !monthlyReport)}
              className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-orange/50 min-h-[44px] min-w-[44px] items-center justify-center ${
                !isGlobalEnabled 
                  ? 'cursor-not-allowed bg-surface-secondary border-border-neutral' 
                  : monthlyReport 
                    ? 'bg-brand-orange cursor-pointer' 
                    : 'bg-surface-secondary border-border-neutral cursor-pointer'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  monthlyReport ? 'translate-x-2.5' : '-translate-x-2.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Privacy & Opt-In Governance Callout */}
      <div className="p-4 bg-brand-orange/10 border border-brand-orange/20 rounded-custom-lg flex items-start gap-3 text-xs text-text-secondary">
        <ShieldCheck size={18} className="text-brand-orange shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-text-primary">Strict Opt-In Guarantee & Privacy Policy</p>
          <p>
            PFM enforces a strict explicit opt-in policy. All email preferences default to OFF. No emails will ever be sent without your explicit permission, and zero financial data is shared with third-party advertising networks.
          </p>
        </div>
      </div>
    </div>
  )
}
