import type { Transaction } from '@/features/financial/types'
import type { DuplicateDismissal } from '../types/recurring'

export interface DuplicateWarning {
  tx1: Transaction
  tx2: Transaction
  confidence: 'high' | 'medium'
  message: string
}

export const detectDuplicateCandidates = (
  transactions: Transaction[],
  dismissedPairs: DuplicateDismissal[]
): DuplicateWarning[] => {
  const warnings: DuplicateWarning[] = []
  
  // Normalize dismissed pairs
  const dismissedSet = new Set<string>()
  dismissedPairs.forEach((pair) => {
    const minId = pair.tx1_id < pair.tx2_id ? pair.tx1_id : pair.tx2_id
    const maxId = pair.tx1_id < pair.tx2_id ? pair.tx2_id : pair.tx1_id
    dismissedSet.add(`${minId}:${maxId}`)
  })
  
  const flaggedSet = new Set<string>()

  for (let i = 0; i < transactions.length; i++) {
    const tx1 = transactions[i]
    for (let j = i + 1; j < transactions.length; j++) {
      const tx2 = transactions[j]
      
      const minId = tx1.id < tx2.id ? tx1.id : tx2.id
      const maxId = tx1.id < tx2.id ? tx2.id : tx1.id
      const pairKey = `${minId}:${maxId}`

      if (dismissedSet.has(pairKey) || flaggedSet.has(pairKey)) {
        continue
      }

      // Check signals: same type, amount, account
      if (
        tx1.transaction_type === tx2.transaction_type &&
        tx1.amount === tx2.amount &&
        tx1.account_id === tx2.account_id
      ) {
        const date1 = new Date(tx1.transaction_date).getTime()
        const date2 = new Date(tx2.transaction_date).getTime()
        const diffDays = Math.abs(date1 - date2) / (1000 * 60 * 60 * 24)

        if (tx1.transaction_date === tx2.transaction_date && tx1.category_id === tx2.category_id) {
          warnings.push({
            tx1,
            tx2,
            confidence: 'high',
            message: `Identical entries of ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(tx1.amount)} on ${tx1.transaction_date}`
          })
          flaggedSet.add(pairKey)
        } else if (diffDays <= 3) {
          warnings.push({
            tx1,
            tx2,
            confidence: 'medium',
            message: `Similar entries of ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(tx1.amount)} within 3 days (${tx1.transaction_date} vs ${tx2.transaction_date})`
          })
          flaggedSet.add(pairKey)
        }
      }
    }
  }

  return warnings
}
