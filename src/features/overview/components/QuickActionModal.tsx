import React from 'react'
import { X } from 'lucide-react'
import { TransactionForm } from '@/components/financial/TransactionForm'
import type { Account, Category } from '@/features/financial/types'

interface QuickActionModalProps {
  isOpen: boolean
  onClose: () => void
  accounts: Account[]
  categories: Category[]
  onSuccess: () => void | Promise<void>
  defaultType?: 'expense' | 'income' | 'transfer'
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  accounts,
  categories,
  onSuccess,
  defaultType = 'expense'
}) => {
  if (!isOpen) return null

  const handleSuccess = async () => {
    await onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full md:max-w-md bg-surface-primary border border-border-neutral rounded-t-custom-xl md:rounded-custom-xl p-6 shadow-2xl z-10 max-h-[90vh] md:max-h-[85vh] overflow-y-auto transform transition-transform duration-300 translate-y-0">
        <div className="flex items-center justify-between pb-4 border-b border-border-neutral mb-4">
          <h3 className="text-lg font-bold text-text-primary">Quick Transaction</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-secondary rounded-custom-md text-text-secondary hover:text-text-primary transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <TransactionForm
          accounts={accounts}
          categories={categories}
          onSuccess={handleSuccess}
          onCancel={onClose}
          defaultType={defaultType}
        />
      </div>
    </div>
  )
}
