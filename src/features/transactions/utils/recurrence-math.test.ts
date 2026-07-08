import { describe, it, expect } from 'vitest'
import {
  clampToLastDayOfMonth,
  calculateNextOccurrenceDate,
  generateOccurrenceDates
} from './recurrence-math'

describe('PFM Recurrence Mathematics (Milestone 6)', () => {
  describe('1. Date Clamping', () => {
    it('should clamp days exceeding total days in February', () => {
      // Non-leap year February: clamps to 28
      expect(clampToLastDayOfMonth(2025, 2, 31)).toBe('2025-02-28')
      // Leap year February: clamps to 29
      expect(clampToLastDayOfMonth(2024, 2, 31)).toBe('2024-02-29')
      // April: clamps to 30
      expect(clampToLastDayOfMonth(2026, 4, 31)).toBe('2026-04-30')
      // January: stays 31
      expect(clampToLastDayOfMonth(2026, 1, 31)).toBe('2026-01-31')
    })
  })

  describe('2. Next Occurrence Calculations', () => {
    it('should calculate next weekly occurrence date correctly', () => {
      expect(calculateNextOccurrenceDate('2026-07-01', 'weekly', '2026-07-01')).toBe('2026-07-08')
      expect(calculateNextOccurrenceDate('2026-07-01', 'weekly', '2026-12-28')).toBe('2027-01-04')
    })

    it('should calculate next monthly occurrence with anchor preserved', () => {
      // Stays on 15th
      expect(calculateNextOccurrenceDate('2026-07-15', 'monthly', '2026-07-15')).toBe('2026-08-15')
    })

    it('should clamp from Jan 31 to Feb 28 and reset to March 31 without drift', () => {
      const feb = calculateNextOccurrenceDate('2026-01-31', 'monthly', '2026-01-31')
      expect(feb).toBe('2026-02-28')

      // March should reset to 31 (anchor day 31 from start date 2026-01-31)
      const mar = calculateNextOccurrenceDate('2026-01-31', 'monthly', feb)
      expect(mar).toBe('2026-03-31')
    })

    it('should calculate quarterly next occurrences', () => {
      expect(calculateNextOccurrenceDate('2026-01-15', 'quarterly', '2026-01-15')).toBe('2026-04-15')
      expect(calculateNextOccurrenceDate('2026-10-31', 'quarterly', '2026-10-31')).toBe('2027-01-31')
    })

    it('should calculate yearly next occurrences', () => {
      expect(calculateNextOccurrenceDate('2026-02-28', 'yearly', '2026-02-28')).toBe('2027-02-28')
      expect(calculateNextOccurrenceDate('2024-02-29', 'yearly', '2024-02-29')).toBe('2025-02-28')
    })
  })

  describe('3. Generate Occurrence Dates Lists', () => {
    it('should generate occurrences list correctly up to horizon', () => {
      const list = generateOccurrenceDates('2026-07-01', 'weekly', '2026-07-01', '2026-07-22')
      expect(list).toEqual(['2026-07-01', '2026-07-08', '2026-07-15', '2026-07-22'])
    })

    it('should stop generating at end_date boundary', () => {
      const list = generateOccurrenceDates('2026-07-01', 'weekly', '2026-07-01', '2026-08-31', '2026-07-15')
      expect(list).toEqual(['2026-07-01', '2026-07-08', '2026-07-15'])
    })
  })
})
