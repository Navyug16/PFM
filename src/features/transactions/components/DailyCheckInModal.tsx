import React, { useState, useEffect } from 'react'
import { CheckCircle2, ChevronRight, X, Calendar, AlertTriangle, AlertCircle, Plus } from 'lucide-react'
import type { RecurringOccurrence } from '../types/recurring'
import type { DuplicateWarning } from '../utils/duplicate-engine'
import type { QualityWarning } from '../utils/quality-engine'
import type { Transaction, Account, Category } from '@/features/financial/types'
import { DuplicateWarningCard } from './DuplicateWarningCard'
import { QualityWarningCard } from './QualityWarningCard'
import { TransactionForm } from '@/components/financial/TransactionForm'
import { formatCurrency } from '@/features/financial/utils/formatters'

interface DailyCheckInModalProps {
  isOpen: boolean
  onClose: () => void
  pendingOccurrences: RecurringOccurrence[]
  duplicateWarnings: DuplicateWarning[]
  qualityWarnings: QualityWarning[]
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
  onConfirmOccurrence: (id: string) => Promise<Transaction>
  onSkipOccurrence: (id: string) => Promise<void>
  onDismissDuplicate: (tx1Id: string, tx2Id: string) => Promise<void>
  onDeleteTransaction: (id: string) => Promise<void>
  onEditTransaction: (tx: Transaction) => void
  onSuccess: () => void
}

export const DailyCheckInModal: React.FC<DailyCheckInModalProps> = ({
  isOpen,
  onClose,
  pendingOccurrences,
  duplicateWarnings,
  qualityWarnings,
  transactions,
  accounts,
  categories,
  onConfirmOccurrence,
  onSkipOccurrence,
  onDismissDuplicate,
  onDeleteTransaction,
  onEditTransaction,
  onSuccess
}) => {
  const [step, setStep] = useState<'recurring' | 'duplicates' | 'quality' | 'quick-add' | 'done'>('recurring')
  const [actionLoading, setActionLoading] = useState(false)

  // Skip step if no items exist (deferred to avoid cascading render warning)
  useEffect(() => {
    if (!isOpen) return

    const timer = setTimeout(() => {
      if (pendingOccurrences.length === 0) {
        if (duplicateWarnings.length === 0) {
          if (qualityWarnings.length === 0) {
            setStep('quick-add')
          } else {
            setStep('quality')
          }
        } else {
          setStep('duplicates')
        }
      } else {
        setStep('recurring')
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [isOpen, pendingOccurrences.length, duplicateWarnings.length, qualityWarnings.length])

  if (!isOpen) return null

  const handleNext = () => {
    if (step === 'recurring') {
      if (duplicateWarnings.length > 0) setStep('duplicates')
      else if (qualityWarnings.length > 0) setStep('quality')
      else setStep('quick-add')
    } else if (step === 'duplicates') {
      if (qualityWarnings.length > 0) setStep('quality')
      else setStep('quick-add')
    } else if (step === 'quality') {
      setStep('quick-add')
    } else if (step === 'quick-add') {
      setStep('done')
    }
  }

  const handleConfirm = async (id: string) => {
    setActionLoading(true)
    try {
      await onConfirmOccurrence(id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to confirm occurrence')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSkip = async (id: string) => {
    if (!confirm('Are you sure you want to skip this expected bill occurrence?')) return
    setActionLoading(true)
    try {
      await onSkipOccurrence(id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to skip occurrence')
    } finally {
      setActionLoading(false)
    }
  }


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-primary border border-border-neutral rounded-custom-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-border-neutral shrink-0">
          <div>
            <h2 className="text-base font-bold text-text-primary">Daily Money Check-In</h2>
            <p className="text-xs text-text-secondary">Keep your ledger clean in under 60 seconds.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-secondary rounded-custom-md text-text-secondary hover:text-text-primary transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Steps Breadcrumbs Indicator */}
        <div className="bg-surface-secondary px-6 py-2 border-b border-border-neutral flex gap-4 text-xs font-semibold select-none shrink-0">
          <span className={step === 'recurring' ? 'text-brand-purple' : 'text-text-secondary'}>
            1. Bills ({pendingOccurrences.length})
          </span>
          <span className="text-border-neutral">/</span>
          <span className={step === 'duplicates' ? 'text-brand-purple' : 'text-text-secondary'}>
            2. Duplicates ({duplicateWarnings.length})
          </span>
          <span className="text-border-neutral">/</span>
          <span className={step === 'quality' ? 'text-brand-purple' : 'text-text-secondary'}>
            3. Quality ({qualityWarnings.length})
          </span>
          <span className="text-border-neutral">/</span>
          <span className={step === 'quick-add' ? 'text-brand-purple' : 'text-text-secondary'}>
            4. Quick Log
          </span>
        </div>

        {/* Step Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {step === 'recurring' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-text-primary font-semibold mb-2">
                <Calendar size={18} className="text-brand-purple" />
                <span>Confirm expected bills due today or overdue</span>
              </div>
              
              <div className="space-y-3">
                {pendingOccurrences.map((occ) => (
                  <div key={occ.id} className="bg-surface-secondary border border-border-neutral rounded-custom-lg p-4 flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">{occ.rule_name}</h4>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Due: {occ.due_date} | Account: {occ.account_name} | Category: {occ.category_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-text-primary mr-2">
                        {formatCurrency(occ.expected_amount)}
                      </span>
                      <button
                        onClick={() => handleSkip(occ.id)}
                        disabled={actionLoading}
                        className="px-2.5 py-1.5 border border-border-neutral text-text-secondary hover:text-text-primary hover:bg-surface-primary text-xs font-semibold rounded-custom-md cursor-pointer transition-all"
                      >
                        Skip
                      </button>
                      <button
                        onClick={() => handleConfirm(occ.id)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-text-primary text-xs font-semibold rounded-custom-md cursor-pointer transition-all"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'duplicates' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-text-primary font-semibold mb-2">
                <AlertTriangle size={18} className="text-state-expense" />
                <span>Review potential duplicate entries</span>
              </div>
              <div className="space-y-3">
                {duplicateWarnings.map((w, idx) => (
                  <DuplicateWarningCard
                    key={idx}
                    warning={w}
                    onKeepBoth={onDismissDuplicate}
                    onDeleteOne={onDeleteTransaction}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 'quality' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-text-primary font-semibold mb-2">
                <AlertCircle size={18} className="text-brand-purple" />
                <span>Resolve transactions with quality warnings</span>
              </div>
              <div className="space-y-3">
                {qualityWarnings.map((w, idx) => {
                  const tx = transactions.find((t) => t.id === w.transactionId)
                  if (!tx) return null
                  return (
                    <QualityWarningCard
                      key={idx}
                      warning={w}
                      transaction={tx}
                      onEdit={onEditTransaction}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {step === 'quick-add' && (
            <div className="space-y-4 max-w-md mx-auto">
              <div className="flex items-center gap-2 text-text-primary font-semibold mb-2 justify-center">
                <Plus size={18} className="text-brand-purple" />
                <span>Log any other expenses or income from today</span>
              </div>
              
              <div className="bg-surface-secondary border border-border-neutral rounded-custom-lg p-5">
                <TransactionForm
                  accounts={accounts}
                  categories={categories}
                  onSuccess={onSuccess}
                />
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <CheckCircle2 size={64} className="text-state-positive" />
              <h3 className="text-lg font-bold text-text-primary">You are all caught up!</h3>
              <p className="text-sm text-text-secondary max-w-sm">
                Your checks are complete and your balance sheets are fully updated. Great job maintaining financial discipline.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-brand-purple hover:bg-brand-purple/95 text-text-primary font-semibold text-sm rounded-custom-md cursor-pointer transition-all"
              >
                Close Check-In
              </button>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        {step !== 'done' && (
          <div className="px-6 py-4 border-t border-border-neutral bg-surface-secondary flex justify-end shrink-0">
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-2 bg-brand-purple hover:bg-brand-purple/90 text-text-primary text-xs font-semibold rounded-custom-md cursor-pointer transition-all"
            >
              Continue <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
