import React, { useState } from 'react'
import { AlertTriangle, Check, Trash2 } from 'lucide-react'
import type { DuplicateWarning } from '../utils/duplicate-engine'

interface DuplicateWarningCardProps {
  warning: DuplicateWarning
  onKeepBoth: (tx1Id: string, tx2Id: string) => Promise<void>
  onDeleteOne: (id: string) => Promise<void>
}

export const DuplicateWarningCard: React.FC<DuplicateWarningCardProps> = ({
  warning,
  onKeepBoth,
  onDeleteOne
}) => {
  const { tx1, tx2, message } = warning
  const [loading, setLoading] = useState(false)

  const handleKeepBoth = async () => {
    setLoading(true)
    try {
      await onKeepBoth(tx1.id, tx2.id)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this duplicate entry?')) return
    setLoading(true)
    try {
      await onDeleteOne(tx2.id)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-state-expense/10 border border-state-expense/25 rounded-custom-lg p-4 flex flex-col justify-between md:flex-row md:items-center gap-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-state-expense shrink-0 mt-1" size={18} />
        <div>
          <h4 className="text-sm font-bold text-text-primary">Possible Duplicate Entry</h4>
          <p className="text-xs text-text-secondary mt-1">{message}</p>
          <div className="text-[10px] text-text-secondary mt-2 flex flex-wrap gap-2">
            <span className="bg-surface-secondary px-2 py-0.5 rounded-custom-full border border-border-neutral">
              Entry 1: #{tx1.id.slice(0, 8)} ({tx1.payee_or_source || 'No payee description'})
            </span>
            <span className="bg-surface-secondary px-2 py-0.5 rounded-custom-full border border-border-neutral">
              Entry 2: #{tx2.id.slice(0, 8)} ({tx2.payee_or_source || 'No payee description'})
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
        <button
          onClick={handleKeepBoth}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-secondary hover:bg-surface-secondary/80 border border-border-neutral text-text-primary text-xs font-semibold rounded-custom-md cursor-pointer transition-all"
        >
          <Check size={14} className="text-state-positive" /> Keep Both
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-state-expense hover:bg-state-expense/90 text-text-primary text-xs font-semibold rounded-custom-md cursor-pointer transition-all"
        >
          <Trash2 size={14} /> Delete Entry #2
        </button>
      </div>
    </div>
  )
}
