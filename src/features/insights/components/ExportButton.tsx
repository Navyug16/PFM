import React, { useState, useRef, useEffect } from 'react'
import { Download, FileText, CheckCircle2, ChevronDown } from 'lucide-react'
import type { Transaction, Account, Category, Goal, GoalContribution } from '@/features/financial/types'
import {
  exportTransactionsToCSV,
  exportAccountSummaryToCSV,
  exportCategorySpendingToCSV,
  exportGoalProgressToCSV
} from '../utils/csv-export'

interface ExportButtonProps {
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
  goals: Goal[]
  contributionsMap: { [goalId: string]: GoalContribution[] }
  todayStr: string
  periodExpenses: number
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  transactions,
  accounts,
  categories,
  goals,
  contributionsMap,
  todayStr,
  periodExpenses
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [exporting, setExporting] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const triggerDownload = (csvContent: string, fileName: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', fileName)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExport = (type: 'transactions' | 'accounts' | 'categories' | 'goals') => {
    setExporting(type)
    setSuccess(null)

    setTimeout(() => {
      try {
        let content = ''
        let fileName = ''

        switch (type) {
          case 'transactions':
            content = exportTransactionsToCSV(transactions, accounts, categories)
            fileName = `pfm_transactions_${todayStr}.csv`
            break
          case 'accounts':
            content = exportAccountSummaryToCSV(accounts, transactions)
            fileName = `pfm_accounts_summary_${todayStr}.csv`
            break
          case 'categories':
            content = exportCategorySpendingToCSV(categories, transactions, [], periodExpenses)
            fileName = `pfm_category_spending_${todayStr}.csv`
            break
          case 'goals':
            content = exportGoalProgressToCSV(goals, contributionsMap, todayStr)
            fileName = `pfm_goals_progress_${todayStr}.csv`
            break
        }

        triggerDownload(content, fileName)
        setSuccess(type)
      } catch (err) {
        alert('Failed to generate export file.')
        console.error(err)
      } finally {
        setExporting(null)
      }
    }, 200)
  }

  const exportOptions = [
    {
      id: 'transactions' as const,
      label: 'Transaction Ledger CSV',
      description: 'Full ledger rows with amounts, categories & tags'
    },
    {
      id: 'accounts' as const,
      label: 'Account Balances CSV',
      description: 'Active checking, savings & credit accounts'
    },
    {
      id: 'categories' as const,
      label: 'Category Outlays CSV',
      description: 'Category spending breakdown & averages'
    },
    {
      id: 'goals' as const,
      label: 'Savings Goals CSV',
      description: 'Goals target deadlines, saved amounts & pace'
    }
  ]

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[44px] px-3.5 py-2 bg-brand-orange hover:bg-brand-orange/90 text-white text-xs font-bold rounded-custom-md cursor-pointer transition-all flex items-center gap-2 shadow-subtle focus:outline-none focus:ring-2 focus:ring-brand-orange"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Export CSV Options Menu"
      >
        <Download size={15} />
        <span>Export CSV</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-72 rounded-custom-xl bg-surface-primary border border-border-neutral shadow-lg p-2 z-50 focus:outline-none space-y-1"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="px-3 py-2 border-b border-border-neutral/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">
              Browser Local Export Center
            </span>
            <span className="text-[11px] text-text-muted">
              Select dataset to compile CSV file
            </span>
          </div>

          <div className="py-1 space-y-1">
            {exportOptions.map((option) => {
              const isExporting = exporting === option.id
              const isSuccess = success === option.id

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleExport(option.id)}
                  disabled={exporting !== null}
                  className="w-full text-left px-3 py-2.5 rounded-custom-lg hover:bg-surface-secondary flex items-start gap-2.5 transition-all cursor-pointer group focus:outline-none focus:ring-1 focus:ring-brand-orange"
                  role="menuitem"
                >
                  <FileText size={16} className="text-brand-orange shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary group-hover:text-brand-orange transition-colors">
                        {option.label}
                      </span>
                      {isSuccess && <CheckCircle2 size={13} className="text-state-income shrink-0" />}
                    </div>
                    <span className="text-[10px] text-text-secondary block truncate mt-0.5">
                      {isExporting ? 'Compiling CSV...' : option.description}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
