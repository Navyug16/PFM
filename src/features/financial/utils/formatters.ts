/**
 * Centralized formatting utilities for PFM.
 */

import { APP_CONFIG } from '@/config/app-config'

/**
 * Formats a number as a currency string.
 * Defaults to configuration defaults if not specified.
 */
export const formatCurrency = (
  val: number,
  currency: string = APP_CONFIG.defaults.currency,
  locale: string = APP_CONFIG.defaults.locale,
  options?: Intl.NumberFormatOptions
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      ...options,
    }).format(val)
  } catch (err) {
    // Fallback if locale or currency code is invalid
    console.error('formatCurrency error:', err)
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      ...options,
    }).format(val)
  }
}

/**
 * Formats a percentage value.
 */
export const formatPercentage = (
  val: number,
  options?: Intl.NumberFormatOptions
): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
    ...options,
  }).format(val / 100)
}

/**
 * Formats a date string based on user format and locale preferences.
 */
export const formatDate = (
  dateStr: string | Date,
  dateFormat: string = APP_CONFIG.defaults.dateFormat,
  locale: string = APP_CONFIG.defaults.locale
): string => {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) {
    return String(dateStr)
  }

  // Support direct locale formatting if needed
  if (locale === 'en-IN' && dateFormat === 'YYYY-MM-DD') {
    // Custom overrides or default
  }

  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()

  if (dateFormat === 'DD-MM-YYYY') {
    return `${dd}-${mm}-${yyyy}`
  }
  if (dateFormat === 'MM-DD-YYYY') {
    return `${mm}-${dd}-${yyyy}`
  }
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Formats a timestamp as date-time.
 */
export const formatDateTime = (
  dateStr: string | Date,
  dateFormat: string = APP_CONFIG.defaults.dateFormat,
  locale: string = APP_CONFIG.defaults.locale
): string => {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) {
    return String(dateStr)
  }

  const datePart = formatDate(d, dateFormat, locale)
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  
  return `${datePart} ${hh}:${min}`
}
export default formatCurrency
