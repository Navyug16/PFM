import { describe, expect, it } from 'vitest'
import { validateDisplayName, validateNewPassword } from './settings-validation'

describe('Settings Validation Engine', () => {
  describe('validateDisplayName', () => {
    it('should reject empty or whitespace-only display names', () => {
      expect(validateDisplayName('')).toBe('Display name cannot be empty.')
      expect(validateDisplayName('   ')).toBe('Display name cannot be empty.')
    })

    it('should reject names that are too short', () => {
      expect(validateDisplayName('A')).toBe('Display name must be at least 2 characters.')
    })

    it('should reject names that exceed 50 characters', () => {
      const longName = 'a'.repeat(51)
      expect(validateDisplayName(longName)).toBe('Display name cannot exceed 50 characters.')
    })

    it('should accept valid display names', () => {
      expect(validateDisplayName('John Doe')).toBeNull()
      expect(validateDisplayName('Avi')).toBeNull()
    })
  })

  describe('validateNewPassword', () => {
    it('should reject passwords that are too short', () => {
      expect(validateNewPassword('Ab1!')).toBe('Password must be at least 8 characters long.')
    })

    it('should reject passwords without uppercase letters', () => {
      expect(validateNewPassword('ab1!cdefg')).toBe('Password must contain at least one uppercase letter.')
    })

    it('should reject passwords without lowercase letters', () => {
      expect(validateNewPassword('AB1!CDEFG')).toBe('Password must contain at least one lowercase letter.')
    })

    it('should reject passwords without numbers', () => {
      expect(validateNewPassword('Ab!cdefgh')).toBe('Password must contain at least one number.')
    })

    it('should reject passwords without special characters', () => {
      expect(validateNewPassword('Ab1cdefgh')).toBe('Password must contain at least one special character.')
    })

    it('should accept valid secure passwords matching requirements', () => {
      expect(validateNewPassword('Aa1!bbccdd')).toBeNull()
      expect(validateNewPassword('Secure123#')).toBeNull()
    })
  })
})
