import React from 'react'
import { AlertCircle, Edit } from 'lucide-react'
import type { QualityWarning } from '../utils/quality-engine'
import type { Transaction } from '@/features/financial/types'

interface QualityWarningCardProps {
  warning: QualityWarning
  transaction: Transaction
  onEdit: (tx: Transaction) => void
}

export const QualityWarningCard: React.FC<QualityWarningCardProps> = ({
  warning,
  transaction,
  onEdit
}) => {
  const { message, severity } = warning
  
  const severityStyles = {
    info: 'bg-brand-purple/5 border-brand-purple/10 text-brand-purple',
    review: 'bg-brand-purple/10 border-brand-purple/20 text-brand-purple',
    important: 'bg-state-expense/10 border-state-expense/20 text-state-expense'
  }

  return (
    <div className={`border rounded-custom-lg p-4 flex flex-col justify-between md:flex-row md:items-center gap-4 ${severityStyles[severity]}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="shrink-0 mt-0.5" size={18} />
        <div>
          <h4 className="text-sm font-bold text-text-primary">Record Quality Warning</h4>
          <p className="text-xs text-text-secondary mt-1">{message}</p>
          <div className="text-[10px] text-text-secondary mt-2">
            Reference: #{transaction.id.slice(0, 8)} — {transaction.payee_or_source || 'Untitled Transaction'} ({new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(transaction.amount)} on {transaction.transaction_date})
          </div>
        </div>
      </div>
      <button
        onClick={() => onEdit(transaction)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-secondary hover:bg-surface-secondary/80 border border-border-neutral text-text-primary text-xs font-semibold rounded-custom-md cursor-pointer transition-all self-end md:self-center"
      >
        <Edit size={14} className="text-brand-purple" /> Fix Record
      </button>
    </div>
  )
}
