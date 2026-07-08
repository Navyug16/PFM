import { describe, it, expect } from 'vitest'
import { formatCurrency } from './formatters'

describe('formatCurrency', () => {
  it('should format numbers to INR correctly', () => {
    // Non-breaking spaces and specific unicode currency symbols are handled by Intl.NumberFormat
    const result = formatCurrency(12000)
    expect(result).toContain('12,000')
    expect(result).toContain('₹')
  })

  it('should support other currencies', () => {
    const result = formatCurrency(100, 'USD')
    expect(result).toContain('100')
    expect(result).toContain('$')
  })
})
