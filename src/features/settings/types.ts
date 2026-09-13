export type ThemeOption = 'light' | 'dark' | 'system'
export type CurrencyOption = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SGD'
export type LocaleOption = 'en-IN' | 'en-US' | 'en-GB' | 'de-DE' | 'fr-FR' | 'en-AE' | 'en-SG'
export type DateFormatOption = 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY'

export interface UserProfile {
  id: string
  display_name: string | null
  theme: ThemeOption
  currency: CurrencyOption
  locale: LocaleOption
  week_start: number // 0 = Sunday, 1 = Monday
  fy_start_month: number // 1 = Jan, 4 = Apr
  date_format: DateFormatOption
  email_notifications_enabled: boolean
  weekly_summary_enabled: boolean
  monthly_report_enabled: boolean
  created_at: string
  updated_at: string
}
