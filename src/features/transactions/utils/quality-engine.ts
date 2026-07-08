import type { Transaction } from '@/features/financial/types'

export interface QualityContext {
  categories: { [id: string]: { name: string; is_active: boolean } }
  accounts: { [id: string]: { name: string; is_active: boolean } }
}

export interface QualityWarning {
  transactionId: string
  message: string
  severity: 'info' | 'review' | 'important'
  fieldToFix: 'notes' | 'category_id' | 'transaction_date' | 'account_id'
}

export const evaluateTransactionQuality = (
  tx: Transaction,
  context: QualityContext,
  todayStr: string
): QualityWarning[] => {
  const warnings: QualityWarning[] = []

  // 1. Missing notes/payee description
  const hasPayee = tx.payee_or_source && tx.payee_or_source.trim().length > 0
  const hasNotes = tx.notes && tx.notes.trim().length > 0
  if (!hasPayee && !hasNotes) {
    warnings.push({
      transactionId: tx.id,
      message: 'Missing description or reference notes.',
      severity: 'info',
      fieldToFix: 'notes'
    })
  }

  // 2. Uncategorized Expense
  if (tx.transaction_type === 'expense' && !tx.category_id) {
    warnings.push({
      transactionId: tx.id,
      message: 'Uncategorized expense decreases budget tracking accuracy.',
      severity: 'review',
      fieldToFix: 'category_id'
    })
  }

  // 3. Future-dated Transaction
  if (tx.transaction_date > todayStr) {
    warnings.push({
      transactionId: tx.id,
      message: `Transaction date (${tx.transaction_date}) is set in the future.`,
      severity: 'important',
      fieldToFix: 'transaction_date'
    })
  }

  // 4. Unusually Old Entry (> 30 days)
  const txTime = new Date(tx.transaction_date).getTime()
  const todayTime = new Date(todayStr).getTime()
  const diffDays = (todayTime - txTime) / (1000 * 60 * 60 * 24)
  if (diffDays > 30) {
    warnings.push({
      transactionId: tx.id,
      message: `Logged date is older than 30 days (${tx.transaction_date}).`,
      severity: 'info',
      fieldToFix: 'transaction_date'
    })
  }

  // 5. Inactive/Archived category reference
  if (tx.category_id) {
    const cat = context.categories[tx.category_id]
    if (cat && !cat.is_active) {
      warnings.push({
        transactionId: tx.id,
        message: `References an archived category (${cat.name}).`,
        severity: 'important',
        fieldToFix: 'category_id'
      })
    }
  }

  // 6. Inactive/Archived account reference
  const acc = context.accounts[tx.account_id]
  if (acc && !acc.is_active) {
    warnings.push({
      transactionId: tx.id,
      message: `References an inactive account (${acc.name}).`,
      severity: 'important',
      fieldToFix: 'account_id'
    })
  }

  // 7. Internal destination account archived
  if (tx.transaction_type === 'transfer' && tx.transfer_to_account_id) {
    const destAcc = context.accounts[tx.transfer_to_account_id]
    if (destAcc && !destAcc.is_active) {
      warnings.push({
        transactionId: tx.id,
        message: `Internal transfer destination account is archived (${destAcc.name}).`,
        severity: 'important',
        fieldToFix: 'account_id'
      })
    }
  }

  return warnings
}
