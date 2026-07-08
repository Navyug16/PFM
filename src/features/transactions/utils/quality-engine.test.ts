import { describe, it, expect } from 'vitest'
import { evaluateTransactionQuality } from './quality-engine'
import type { Transaction } from '@/features/financial/types'

describe('PFM Transaction Quality Engine (Milestone 6)', () => {
  const context = {
    categories: {
      'cat-food': { name: 'Food', is_active: true },
      'cat-old-rent': { name: 'Rent Legacy', is_active: false } // Archived category
    },
    accounts: {
      'acc-checking': { name: 'Checking Account', is_active: true },
      'acc-old-credit': { name: 'Legacy Credit Card', is_active: false } // Inactive account
    }
  }

  const baseTx: Transaction = {
    id: 'tx-1',
    user_id: 'user-1',
    transaction_type: 'expense',
    amount: 100,
    account_id: 'acc-checking',
    category_id: 'cat-food',
    transfer_to_account_id: null,
    transaction_date: '2026-07-01',
    payee_or_source: 'Groceries',
    notes: 'Weekly buy',
    created_at: '',
    updated_at: ''
  }

  it('should return empty warnings for clean transaction', () => {
    const warnings = evaluateTransactionQuality(baseTx, context, '2026-07-02')
    expect(warnings.length).toBe(0)
  })

  it('should flag missing payee and notes description', () => {
    const tx = { ...baseTx, payee_or_source: '', notes: null }
    const warnings = evaluateTransactionQuality(tx, context, '2026-07-02')
    expect(warnings.some((w) => w.fieldToFix === 'notes' && w.severity === 'info')).toBe(true)
  })

  it('should flag uncategorized expenses', () => {
    const tx = { ...baseTx, category_id: null }
    const warnings = evaluateTransactionQuality(tx, context, '2026-07-02')
    expect(warnings.some((w) => w.fieldToFix === 'category_id' && w.severity === 'review')).toBe(true)
  })

  it('should flag future-dated transaction entries', () => {
    const tx = { ...baseTx, transaction_date: '2026-07-15' }
    const warnings = evaluateTransactionQuality(tx, context, '2026-07-05') // July 15 is after July 5
    expect(warnings.some((w) => w.fieldToFix === 'transaction_date' && w.severity === 'important')).toBe(true)
  })

  it('should flag references to archived categories', () => {
    const tx = { ...baseTx, category_id: 'cat-old-rent' }
    const warnings = evaluateTransactionQuality(tx, context, '2026-07-02')
    expect(warnings.some((w) => w.fieldToFix === 'category_id' && w.severity === 'important' && w.message.includes('Legacy Rent'))).toBe(false)
    expect(warnings.some((w) => w.fieldToFix === 'category_id' && w.severity === 'important')).toBe(true)
  })

  it('should flag references to inactive accounts', () => {
    const tx = { ...baseTx, account_id: 'acc-old-credit' }
    const warnings = evaluateTransactionQuality(tx, context, '2026-07-02')
    expect(warnings.some((w) => w.fieldToFix === 'account_id' && w.severity === 'important')).toBe(true)
  })
})
