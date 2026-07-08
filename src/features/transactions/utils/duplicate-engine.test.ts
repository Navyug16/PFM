import { describe, it, expect } from 'vitest'
import { detectDuplicateCandidates } from './duplicate-engine'
import type { Transaction } from '@/features/financial/types'

describe('PFM Duplicate warning Engine (Milestone 6)', () => {
  const mockTxs: Transaction[] = [
    {
      id: 'tx-1',
      user_id: 'user-1',
      transaction_type: 'expense',
      amount: 450,
      account_id: 'acc-checking',
      category_id: 'cat-movie',
      transfer_to_account_id: null,
      transaction_date: '2026-07-05',
      payee_or_source: 'Movie',
      notes: null,
      created_at: '',
      updated_at: ''
    },
    {
      id: 'tx-2',
      user_id: 'user-1',
      transaction_type: 'expense',
      amount: 450,
      account_id: 'acc-checking',
      category_id: 'cat-movie',
      transfer_to_account_id: null,
      transaction_date: '2026-07-05',
      payee_or_source: 'Cinema',
      notes: 'Repeated log?',
      created_at: '',
      updated_at: ''
    },
    {
      id: 'tx-3',
      user_id: 'user-1',
      transaction_type: 'expense',
      amount: 450,
      account_id: 'acc-checking',
      category_id: 'cat-food', // Different category, but same amount/account within 3 days
      transfer_to_account_id: null,
      transaction_date: '2026-07-07',
      payee_or_source: 'Dinner',
      notes: null,
      created_at: '',
      updated_at: ''
    },
    {
      id: 'tx-4',
      user_id: 'user-1',
      transaction_type: 'expense',
      amount: 500, // Different amount
      account_id: 'acc-checking',
      category_id: 'cat-movie',
      transfer_to_account_id: null,
      transaction_date: '2026-07-05',
      payee_or_source: 'Movie',
      notes: null,
      created_at: '',
      updated_at: ''
    }
  ]

  it('should flag high confidence duplicate candidates with identical properties', () => {
    const warnings = detectDuplicateCandidates(mockTxs, [])
    const high = warnings.filter((w) => w.confidence === 'high')
    expect(high.length).toBe(1)
    expect(high[0].tx1.id).toBe('tx-1')
    expect(high[0].tx2.id).toBe('tx-2')
  })

  it('should flag medium confidence duplicates within 3 days window', () => {
    const warnings = detectDuplicateCandidates(mockTxs, [])
    const medium = warnings.filter((w) => w.confidence === 'medium')
    
    // tx-1 vs tx-3 (July 5 vs July 7, 2 days diff)
    // tx-2 vs tx-3 (July 5 vs July 7, 2 days diff)
    expect(medium.length).toBe(2)
  })

  it('should filter out dismissed duplicate pairs', () => {
    const dismissals = [
      { user_id: 'user-1', tx1_id: 'tx-1', tx2_id: 'tx-2', created_at: '' }
    ]
    const warnings = detectDuplicateCandidates(mockTxs, dismissals)
    const high = warnings.filter((w) => w.confidence === 'high')
    expect(high.length).toBe(0) // Dismissed!
  })
})
