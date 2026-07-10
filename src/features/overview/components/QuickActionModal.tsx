import React, { useEffect, useRef } from 'react'
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
  const modalRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  // Capture triggering active element on open to restore it on close
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement
      // Focus modal content
      modalRef.current?.focus()
    } else if (triggerRef.current) {
      triggerRef.current.focus()
    }
  }, [isOpen])

  // Escape key listener
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Focus Trapping Logic
  useEffect(() => {
    if (!isOpen) return

    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return

      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === last) {
          first.focus()
          e.preventDefault()
        }
      }
    }

    window.addEventListener('keydown', handleFocusTrap)
    return () => window.removeEventListener('keydown', handleFocusTrap)
  }, [isOpen])

  if (!isOpen) return null

  const handleSuccess = async () => {
    await onSuccess()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full md:max-w-md bg-surface-primary border border-border-neutral rounded-t-custom-xl md:rounded-custom-xl p-6 shadow-2xl z-10 max-h-[90vh] md:max-h-[85vh] overflow-y-auto outline-none"
      >
        <div className="flex items-center justify-between pb-4 border-b border-border-neutral mb-4">
          <h3 id="quick-modal-title" className="text-lg font-bold text-text-primary">
            Quick Transaction
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-secondary rounded-custom-md text-text-secondary hover:text-text-primary transition-all cursor-pointer"
            aria-label="Close dialog"
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
export default QuickActionModal
