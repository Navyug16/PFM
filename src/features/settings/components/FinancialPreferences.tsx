import React, { useState } from 'react'
import { useSettings } from '../hooks/useSettings'
import type { CurrencyOption, LocaleOption, DateFormatOption } from '../types'

export const FinancialPreferences: React.FC = () => {
  const { profile, updateProfile } = useSettings()

  const [currency, setCurrency] = useState<CurrencyOption>(profile?.currency || 'INR')
  const [locale, setLocale] = useState<LocaleOption>(profile?.locale || 'en-IN')
  const [weekStart, setWeekStart] = useState<number>(profile?.week_start ?? 1)
  const [fyStart, setFyStart] = useState<number>(profile?.fy_start_month ?? 4)
  const [dateFormat, setDateFormat] = useState<DateFormatOption>(profile?.date_format || 'YYYY-MM-DD')

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(null)
    setError(null)
    setLoading(true)

    try {
      await updateProfile({
        currency,
        locale,
        week_start: Number(weekStart),
        fy_start_month: Number(fyStart),
        date_format: dateFormat,
      })
      setSuccess('Financial preferences updated successfully.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-6 space-y-6">
      <div>
        <h3 className="text-base font-bold text-text-primary">Financial & Regional Preferences</h3>
        <p className="text-xs text-text-secondary mt-1">
          Customize currency symbols, locales, and accounting period boundaries.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        {error && (
          <div className="p-3 bg-state-expense/10 border border-state-expense/20 text-state-expense rounded-custom-md text-xs font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-state-positive/10 border border-state-positive/20 text-state-positive rounded-custom-md text-xs font-medium">
            {success}
          </div>
        )}

        {/* Currency Dropdown */}
        <div>
          <label htmlFor="pref-currency" className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
            Default Currency (For New Accounts)
          </label>
          <select
            id="pref-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyOption)}
            disabled={loading}
            className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2.5 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="AED">AED (د.إ)</option>
            <option value="SGD">SGD (S$)</option>
          </select>
        </div>

        {/* Locale Dropdown */}
        <div>
          <label htmlFor="pref-locale" className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
            Regional Locale Code
          </label>
          <select
            id="pref-locale"
            value={locale}
            onChange={(e) => setLocale(e.target.value as LocaleOption)}
            disabled={loading}
            className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2.5 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
          >
            <option value="en-IN">English (India) - en-IN</option>
            <option value="en-US">English (United States) - en-US</option>
            <option value="en-GB">English (United Kingdom) - en-GB</option>
            <option value="de-DE">German (Germany) - de-DE</option>
            <option value="fr-FR">French (France) - fr-FR</option>
            <option value="en-AE">English (UAE) - en-AE</option>
            <option value="en-SG">English (Singapore) - en-SG</option>
          </select>
        </div>

        {/* Date Format Select */}
        <div>
          <label htmlFor="pref-date-format" className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
            Date Presentation Format
          </label>
          <select
            id="pref-date-format"
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value as DateFormatOption)}
            disabled={loading}
            className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2.5 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
          >
            <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-07-10)</option>
            <option value="DD-MM-YYYY">DD-MM-YYYY (e.g. 10-07-2026)</option>
            <option value="MM-DD-YYYY">MM-DD-YYYY (e.g. 07-10-2026)</option>
          </select>
        </div>

        {/* Week Start Toggles */}
        <div>
          <label htmlFor="pref-week-start" className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
            First Day of the Week
          </label>
          <select
            id="pref-week-start"
            value={weekStart}
            onChange={(e) => setWeekStart(Number(e.target.value))}
            disabled={loading}
            className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2.5 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
          >
            <option value={1}>Monday</option>
            <option value={0}>Sunday</option>
          </select>
        </div>

        {/* Financial Year Start */}
        <div>
          <label htmlFor="pref-fy-start" className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
            Financial Year Boundary Start Month
          </label>
          <select
            id="pref-fy-start"
            value={fyStart}
            onChange={(e) => setFyStart(Number(e.target.value))}
            disabled={loading}
            className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2.5 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
          >
            <option value={4}>April 1st (Indian Standard)</option>
            <option value={1}>January 1st (Calendar standard)</option>
          </select>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-brand-purple hover:bg-brand-purple/90 text-text-primary font-medium text-sm rounded-custom-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving Preferences...' : 'Save Preferences'}
        </button>
      </form>
    </div>
  )
}
