import React, { useState } from 'react'
import { Download, FileText, CheckCircle2 } from 'lucide-react'
import type { Transaction, Account, Category, Goal, GoalContribution } from '@/features/financial/types'
import {
  exportTransactionsToCSV,
  exportAccountSummaryToCSV,
  exportCategorySpendingToCSV,
  exportGoalProgressToCSV
} from '../utils/csv-export'

interface ExportPanelProps {
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
  goals: Goal[]
  contributionsMap: { [goalId: string]: GoalContribution[] }
  todayStr: string
  periodExpenses: number
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  transactions,
  accounts,
  categories,
  goals,
  contributionsMap,
  todayStr,
  periodExpenses
}) => {
  const [exporting, setExporting] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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
    
    // Simulate brief deferal for UX feedback
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
    }, 300)
  }

  const exportButtons: {
    id: 'transactions' | 'accounts' | 'categories' | 'goals'
    label: string
    description: string
  }[] = [
    {
      id: 'transactions',
      label: 'Transaction Ledger CSV',
      description: 'Full ledger rows containing amounts, categories, and tags.'
    },
    {
      id: 'accounts',
      label: 'Account Balances CSV',
      description: 'Lists all checking, savings, and credit accounts with derived balances.'
    },
    {
      id: 'categories',
      label: 'Category Outlays CSV',
      description: 'Exports spending breakdown percentages and average transaction sizes.'
    },
    {
      id: 'goals',
      label: 'Savings Goals Progress CSV',
      description: 'Exports target deadlines, amounts saved, and pace statuses.'
    }
  ]

  return (
    <div className="bg-surface-secondary border border-border-neutral rounded-custom-xl p-5 md:p-6 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
          <Download size={18} className="text-brand-purple" />
          <span>Local Export Center</span>
        </h3>
        <p className="text-xs text-text-secondary mt-0.5">
          Generate spreadsheet compatible CSV templates safely in your browser.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        {exportButtons.map((btn) => {
          const isExporting = exporting === btn.id
          const isSuccess = success === btn.id

          return (
            <div
              key={btn.id}
              className="bg-surface-primary border border-border-neutral rounded-custom-lg p-4 flex flex-col justify-between space-y-4 hover:shadow-subtle transition-all"
            >
              <div className="space-y-1">
                <FileText size={20} className="text-brand-purple" />
                <h4 className="text-xs font-bold text-text-primary mt-1">{btn.label}</h4>
                <p className="text-[10px] text-text-secondary leading-normal">{btn.description}</p>
              </div>

              <button
                onClick={() => handleExport(btn.id)}
                disabled={exporting !== null}
                className={`w-full py-2 border rounded-custom-md text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  isSuccess
                    ? 'bg-state-income/10 border-state-income text-state-income'
                    : 'bg-surface-secondary border-border-neutral hover:bg-surface-elevated text-text-primary'
                }`}
              >
                {isSuccess ? (
                  <>
                    <CheckCircle2 size={12} /> Exported
                  </>
                ) : isExporting ? (
                  'Compiling...'
                ) : (
                  <>
                    <Download size={12} /> Download CSV
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
