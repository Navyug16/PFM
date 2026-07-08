/**
 * Shared formatting utilities for PFM
 */

/**
 * Formats a number as a currency string using the Indian English locale (en-IN).
 * Defaults to Indian Rupees (INR) and allows optional Intl override parameters.
 */
export const formatCurrency = (
  val: number,
  currency: string = 'INR',
  options?: Intl.NumberFormatOptions
): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    ...options
  }).format(val)
}
