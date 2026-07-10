import { describe, it, expect } from 'vitest'
import { formatCurrency, formatPercentage, formatDate, formatDateTime } from './formatters'

describe('Formatting Utilities', () => {
  describe('formatCurrency', () => {
    it('should format numbers to INR correctly', () => {
      const result = formatCurrency(12000, 'INR', 'en-IN')
      expect(result).toContain('12,000')
      expect(result).toContain('₹')
    })

    it('should support USD', () => {
      const result = formatCurrency(100, 'USD', 'en-US')
      expect(result).toContain('100')
      expect(result).toContain('$')
    })

    it('should support EUR', () => {
      const result = formatCurrency(150, 'EUR', 'fr-FR')
      expect(result).toContain('150')
      expect(result).toContain('€')
    })

    it('should support GBP', () => {
      const result = formatCurrency(200, 'GBP', 'en-GB')
      expect(result).toContain('200')
      expect(result).toContain('£')
    })

    it('should support AED', () => {
      const result = formatCurrency(300, 'AED', 'en-AE')
      expect(result).toContain('300')
    })

    it('should support SGD', () => {
      const result = formatCurrency(400, 'SGD', 'en-SG')
      expect(result).toContain('400')
    })

    it('should format negative values correctly', () => {
      const result = formatCurrency(-50, 'USD', 'en-US')
      expect(result).toContain('50')
      expect(result).toContain('$')
    })
  })

  describe('formatPercentage', () => {
    it('should format percentage values correctly', () => {
      expect(formatPercentage(50)).toBe('50.0%')
      expect(formatPercentage(12.345)).toBe('12.35%')
      expect(formatPercentage(0)).toBe('0.0%')
    })
  })

  describe('formatDate', () => {
    const testDate = '2026-07-10T12:00:00'

    it('should support YYYY-MM-DD format', () => {
      expect(formatDate(testDate, 'YYYY-MM-DD')).toBe('2026-07-10')
    })

    it('should support DD-MM-YYYY format', () => {
      expect(formatDate(testDate, 'DD-MM-YYYY')).toBe('10-07-2026')
    })

    it('should support MM-DD-YYYY format', () => {
      expect(formatDate(testDate, 'MM-DD-YYYY')).toBe('07-10-2026')
    })
  })

  describe('formatDateTime', () => {
    const testDate = '2026-07-10T14:35:00'

    it('should format full date-time correctly', () => {
      expect(formatDateTime(testDate, 'YYYY-MM-DD')).toContain('2026-07-10 14:35')
    })
  })
})
