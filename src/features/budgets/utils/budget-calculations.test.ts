import { describe, it, expect } from 'vitest'
import {
  calculateBudgetDaysCounts,
  calculateBudgetSpent,
  calculateBudgetRemaining,
  calculateBudgetUsagePercentage,
  calculateCategoryBudgetSpent,
  calculateDailySafeToSpend,
  calculateProjectedPeriodSpending,
  calculateProjectedBudgetVariance,
  calculateBudgetPaceStatus
} from './budget-calculations'

describe('PFM Budget Calculation Engine (Milestone 5)', () => {
  describe('1. Date-Counting Convention', () => {
    it('should calculate correct total, elapsed, and remaining days (today included in both)', () => {
      // 1 July 2026 to 31 July 2026 (31 days total)
      // Reference date July 15: 15 elapsed days (July 1 to July 15), 17 remaining days (July 15 to July 31)
      const res = calculateBudgetDaysCounts('2026-07-01', '2026-07-31', '2026-07-15')
      expect(res.totalDays).toBe(31)
      expect(res.elapsedDays).toBe(15)
      expect(res.remainingDays).toBe(17)
    })

    it('should handle pre-start reference date safely', () => {
      const res = calculateBudgetDaysCounts('2026-07-10', '2026-07-20', '2026-07-05')
      expect(res.totalDays).toBe(11)
      expect(res.elapsedDays).toBe(0)
      expect(res.remainingDays).toBe(11)
    })

    it('should handle post-end reference date safely', () => {
      const res = calculateBudgetDaysCounts('2026-07-10', '2026-07-20', '2026-07-25')
      expect(res.totalDays).toBe(11)
      expect(res.elapsedDays).toBe(11)
      expect(res.remainingDays).toBe(0)
    })
  })

  describe('2. Spent Calculations & Neutrality Guards', () => {
    const mockTxs = [
      { transaction_type: 'expense', amount: 1500, transaction_date: '2026-07-05' },
      { transaction_type: 'expense', amount: 2500, transaction_date: '2026-07-10' },
      { transaction_type: 'income', amount: 5000, transaction_date: '2026-07-12' }, // Income: ignored
      { transaction_type: 'transfer', amount: 1000, transaction_date: '2026-07-14' }, // Transfer: ignored
      { transaction_type: 'expense', amount: 900, transaction_date: '2026-07-25' }, // Out of range in first test
    ]

    it('should calculate spent correctly within date range, ignoring income and transfers', () => {
      const spent = calculateBudgetSpent(mockTxs, '2026-07-01', '2026-07-15')
      // Only July 5 (1500) and July 10 (2500) expenses match. Total = 4000
      expect(spent).toBe(4000)
    })

    it('should allow negative remaining amount (not clamped to zero) when exceeded', () => {
      const remaining = calculateBudgetRemaining(3000, 3500)
      expect(remaining).toBe(-500)
    })

    it('should calculate budget usage percentage correctly', () => {
      expect(calculateBudgetUsagePercentage(1500, 3000)).toBe(50.0)
      expect(calculateBudgetUsagePercentage(0, 3000)).toBe(0)
      expect(calculateBudgetUsagePercentage(1500, 0)).toBe(0)
    })
  })

  describe('3. Category Filtering', () => {
    const mockTxs = [
      { transaction_type: 'expense', amount: 1200, transaction_date: '2026-07-05', category_id: 'cat-food' },
      { transaction_type: 'expense', amount: 1800, transaction_date: '2026-07-08', category_id: 'cat-rent' },
      { transaction_type: 'expense', amount: 500, transaction_date: '2026-07-12', category_id: 'cat-food' },
    ]

    it('should filter category expenses within bounds correctly', () => {
      const spentFood = calculateCategoryBudgetSpent(mockTxs, 'cat-food', '2026-07-01', '2026-07-15')
      expect(spentFood).toBe(1700)
    })
  })

  describe('4. Daily Safe-to-Spend Allowance', () => {
    it('should divide remaining amount by remaining days, clamping safe value at zero', () => {
      // Remaining: 1700, Days: 10 -> 170/day
      expect(calculateDailySafeToSpend(1700, 10)).toBe(170)
      // If remaining is negative, return 0 (not negative safe allowance)
      expect(calculateDailySafeToSpend(-500, 10)).toBe(0)
      expect(calculateDailySafeToSpend(1000, 0)).toBe(0)
    })
  })

  describe('5. Projections & Variance', () => {
    it('should calculate linear spending projections and variance correctly', () => {
      // Spent: 1500 over 15 elapsed days. Period length is 30 days -> Projected: 3000
      const projected = calculateProjectedPeriodSpending(1500, 15, 30)
      expect(projected).toBe(3000)

      const variance = calculateProjectedBudgetVariance(3500, 3000)
      expect(variance).toBe(500)
    })
  })

  describe('6. Budget Pace Status Thresholds', () => {
    // 50% elapsed (15 / 30 days)
    // expected progress threshold is 50% of budget limit (e.g. 1500 of 3000)

    it('should trigger exceeded when spent exceeds limit', () => {
      const status = calculateBudgetPaceStatus(3000, 3500, 15, 30, 4)
      expect(status).toBe('exceeded')
    })

    it('should trigger safe if elapsedDays < 3 or transactionCount < 3 (safeguard)', () => {
      // 1 day elapsed, spent 1200 on 2000 budget. Variance is highly negative, but safeguard prevents alert.
      const status = calculateBudgetPaceStatus(2000, 1200, 1, 30, 2)
      expect(status).toBe('safe')
    })

    it('should trigger safe if actual spent is below expected spent', () => {
      // Limit 3000, Spent 1200 (expected is 1500), elapsed 15 of 30 days
      const status = calculateBudgetPaceStatus(3000, 1200, 15, 30, 5)
      expect(status).toBe('safe')
    })

    it('should trigger watch if spent is above expected and projected overspend is within 10% of total budget limit', () => {
      // Limit: 3000. Spent: 1600 (expected is 1500).
      // Projected spending: (1600/15)*30 = 3200. Projected variance = -200 (overspend is 200, which is < 300 [10% of limit])
      const status = calculateBudgetPaceStatus(3000, 1600, 15, 30, 5)
      expect(status).toBe('watch')
    })

    it('should trigger at_risk if spent is above expected and projected overspend exceeds 10% of total limit', () => {
      // Limit: 3000. Spent: 1900 (expected is 1500).
      // Projected spending: (1900/15)*30 = 3800. Projected variance = -800 (overspend is 800, which is > 300 [10% of limit])
      const status = calculateBudgetPaceStatus(3000, 1900, 15, 30, 5)
      expect(status).toBe('at_risk')
    })
  })

  describe('7. Deterministic Integration Verification Scenario', () => {
    it('should calculate the exact approved scenario results correctly', () => {
      const budgetLimit = 30000
      const startDate = '2026-07-01'
      const endDate = '2026-07-31'
      const referenceDate = '2026-07-15'

      const txs = [
        { transaction_type: 'expense', amount: 4500, transaction_date: '2026-07-05', category_id: 'food-id' },
        { transaction_type: 'expense', amount: 1000, transaction_date: '2026-07-08', category_id: 'transport-id' },
        { transaction_type: 'expense', amount: 2700, transaction_date: '2026-07-12', category_id: 'entertainment-id' },
        { transaction_type: 'expense', amount: 3500, transaction_date: '2026-07-14', category_id: 'utilities-id' },
        { transaction_type: 'expense', amount: 2000, transaction_date: '2026-07-15', category_id: 'other-id' },
      ]

      const spent = calculateBudgetSpent(txs, startDate, endDate)
      const remaining = calculateBudgetRemaining(budgetLimit, spent)

      const daysCounts = calculateBudgetDaysCounts(startDate, endDate, referenceDate)
      const dailySafe = calculateDailySafeToSpend(remaining, daysCounts.remainingDays)
      const projected = calculateProjectedPeriodSpending(spent, daysCounts.elapsedDays, daysCounts.totalDays)
      const variance = calculateProjectedBudgetVariance(budgetLimit, projected)
      const overallStatus = calculateBudgetPaceStatus(budgetLimit, spent, daysCounts.elapsedDays, daysCounts.totalDays, txs.length)

      // Category Specific: Entertainment
      const entLimit = 3000
      const entSpent = calculateCategoryBudgetSpent(txs, 'entertainment-id', startDate, endDate)
      const entStatus = calculateBudgetPaceStatus(entLimit, entSpent, daysCounts.elapsedDays, daysCounts.totalDays, 1)

      expect(spent).toBe(13700)
      expect(remaining).toBe(16300)
      expect(daysCounts.elapsedDays).toBe(15)
      expect(daysCounts.remainingDays).toBe(17)
      expect(Math.round(dailySafe * 100) / 100).toBe(958.82)
      expect(Math.round(projected * 100) / 100).toBe(28313.33)
      expect(Math.round(variance * 100) / 100).toBe(1686.67)
      expect(overallStatus).toBe('safe')
      expect(entStatus).toBe('at_risk')
    })
  })
})
