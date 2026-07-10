/**
 * Helper to validate display names
 */
export const validateDisplayName = (name: string): string | null => {
  const trimmed = name.trim()
  if (!trimmed) {
    return 'Display name cannot be empty.'
  }
  if (trimmed.length < 2) {
    return 'Display name must be at least 2 characters.'
  }
  if (trimmed.length > 50) {
    return 'Display name cannot exceed 50 characters.'
  }
  return null
}

/**
 * Validates new passwords against PFM security policy:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const validateNewPassword = (password: string): string | null => {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.'
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter.'
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter.'
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number.'
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain at least one special character.'
  }
  return null
}
