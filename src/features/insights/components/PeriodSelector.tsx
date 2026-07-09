import React, { useState } from 'react'
import type { ReportPeriodPreset } from '@/features/financial/utils/date-utils'
import { Calendar } from 'lucide-react'

interface PeriodSelectorProps {
  preset: ReportPeriodPreset
  onPresetChange: (preset: ReportPeriodPreset) => void
  customStart: string
  customEnd: string
  onCustomDatesChange: (start: string, end: string) => void
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  preset,
  onPresetChange,
  customStart,
  customEnd,
  onCustomDatesChange
}) => {
  const [startInput, setStartInput] = useState(customStart)
  const [endInput, setEndInput] = useState(customEnd)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleApplyCustomDates = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (!startInput || !endInput) {
      setValidationError('Both start and end dates are required.')
      return
    }

    if (startInput > endInput) {
      setValidationError('Start date must be less than or equal to end date.')
      return
    }

    onCustomDatesChange(startInput, endInput)
  }

  const presetsList: { value: ReportPeriodPreset; label: string }[] = [
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'last_3_months', label: 'Last 3 Months' },
    { value: 'last_6_months', label: 'Last 6 Months' },
    { value: 'this_calendar_year', label: 'This Calendar Year' },
    { value: 'indian_financial_year', label: 'Indian Financial Year (Apr-Mar)' },
    { value: 'custom', label: 'Custom Date Range' }
  ]

  return (
    <div className="bg-surface-secondary border border-border-neutral rounded-custom-xl p-4 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
            Analysis Period
          </label>
          <div className="relative">
            <select
              value={preset}
              onChange={(e) => onPresetChange(e.target.value as ReportPeriodPreset)}
              className="w-full md:w-64 bg-surface-primary border border-border-neutral rounded-custom-md px-3.5 py-2.5 text-text-primary text-sm font-semibold focus:outline-none focus:border-brand-purple transition-all cursor-pointer appearance-none pr-10"
            >
              {presetsList.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-text-secondary">
              <Calendar size={16} />
            </div>
          </div>
        </div>

        {preset === 'custom' && (
          <form onSubmit={handleApplyCustomDates} className="flex-1 md:max-w-md space-y-2">
            <div className="flex flex-col sm:flex-row items-end gap-3">
              <div className="w-full space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startInput}
                  onChange={(e) => setStartInput(e.target.value)}
                  className="w-full bg-surface-primary border border-border-neutral rounded-custom-md px-3 py-2 text-text-primary text-xs font-medium focus:outline-none focus:border-brand-purple transition-all"
                />
              </div>

              <div className="w-full space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
                  End Date
                </label>
                <input
                  type="date"
                  value={endInput}
                  onChange={(e) => setEndInput(e.target.value)}
                  className="w-full bg-surface-primary border border-border-neutral rounded-custom-md px-3 py-2 text-text-primary text-xs font-medium focus:outline-none focus:border-brand-purple transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 bg-brand-purple hover:bg-brand-purple/90 text-text-primary text-xs font-bold rounded-custom-md cursor-pointer transition-all h-[38px] shrink-0"
              >
                Apply Range
              </button>
            </div>
            {validationError && (
              <p className="text-[11px] font-semibold text-state-expense">{validationError}</p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
