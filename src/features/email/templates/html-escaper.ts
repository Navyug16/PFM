/**
 * PFM M14 Phase 3.5.2 — HTML Entity Escaper Utility
 * Safe, pure HTML entity escaping for user-controlled and dynamic strings in email templates.
 */

/**
 * Encodes special HTML characters into safe HTML entity equivalents.
 * Replaces: &, <, >, ", '
 * Safe against null, undefined, or empty values.
 */
export const escapeHtml = (str: string | null | undefined): string => {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
