import React from 'react'
import type { Account } from '@/features/financial/types'
import { formatCurrency as sharedFormatCurrency } from '@/features/financial/utils/formatters'
import { calculateAccountBalance } from '@/features/financial/utils/calculations'
import type { Transaction } from '@/features/financial/types'

interface DashboardHeroCardProps {
  availableBalance: { [currency: string]: number }
  netPosition: { [currency: string]: number }
  accounts: Account[]
  transactions: Transaction[]
  primaryCurrency: string
  userLocale: string
}

export const DashboardHeroCard: React.FC<DashboardHeroCardProps> = ({
  availableBalance,
  netPosition,
  accounts,
  transactions,
  primaryCurrency,
  userLocale
}) => {
  const formatCurrency = (val: number, curr?: string) => {
    return sharedFormatCurrency(val, curr || primaryCurrency, userLocale, {
      maximumFractionDigits: 0
    })
  }

  const formatMultiCurrency = (value: { [currency: string]: number }) => {
    const entries = Object.entries(value)
    if (entries.length === 0) return formatCurrency(0)
    if (entries.length === 1) return formatCurrency(entries[0][1], entries[0][0])
    return entries
      .map(([curr, val]) => sharedFormatCurrency(val, curr, userLocale, { maximumFractionDigits: 0 }))
      .join(' | ')
  }

  // Filter liquid accounts (checking, savings, cash)
  const liquidAccounts = accounts.filter(
    (acc) => acc.is_active && ['checking', 'savings', 'cash'].includes(acc.account_type)
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Primary Hero: Total Available Funds (Liquid Solvency) */}
      <div className="lg:col-span-2 bg-gradient-to-br from-brand-orange/15 to-brand-orange/5 border border-brand-orange/30 rounded-custom-xl p-5 md:p-6 flex flex-col justify-between shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />
        
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] md:text-xs font-bold text-brand-orange uppercase tracking-wider bg-brand-orange/15 border border-brand-orange/25 px-2.5 py-1 rounded-custom-full">
              Primary Solvency
            </span>
            <span className="text-[11px] font-semibold text-text-secondary">
              {liquidAccounts.length} liquid {liquidAccounts.length === 1 ? 'account' : 'accounts'}
            </span>
          </div>

          <h2 className="text-xs md:text-sm font-semibold text-text-secondary mt-3">
            Total Available Funds
          </h2>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-text-primary tracking-tight mt-1 tabular-nums">
            {formatMultiCurrency(availableBalance)}
          </h1>
          <p className="text-xs text-text-secondary mt-1.5 font-medium">
            Liquid cash available across checking, savings, and cash accounts
          </p>
        </div>

        {/* Liquid accounts breakdown sub-strip */}
        {liquidAccounts.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-brand-orange/20 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {liquidAccounts.slice(0, 6).map((acc) => {
              const bal = calculateAccountBalance(acc, transactions)
              return (
                <div key={acc.id} className="bg-surface-primary/60 border border-border-neutral/40 rounded-custom-md px-2.5 py-1.5">
                  <span className="text-[10px] text-text-secondary truncate block font-medium">
                    {acc.name}
                  </span>
                  <span className="text-xs font-bold text-text-primary tabular-nums">
                    {formatCurrency(bal, acc.currency_code)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Secondary Metric: Net Financial Position (Balance Sheet) */}
      <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-5 md:p-6 flex flex-col justify-between shadow-sm">
        <div>
          <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider bg-surface-secondary border border-border-neutral px-2.5 py-1 rounded-custom-full">
            Balance Sheet
          </span>
          <h3 className="text-xs font-semibold text-text-secondary mt-3">
            Net Financial Position
          </h3>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight mt-1 tabular-nums">
            {formatMultiCurrency(netPosition)}
          </h2>
          <p className="text-xs text-text-secondary mt-2">
            Total net worth across all active accounts including credit cards, investments, & liabilities
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-border-neutral/50 text-[11px] text-text-muted flex justify-between items-center">
          <span>{accounts.filter((a) => a.is_active).length} active accounts tracked</span>
        </div>
      </div>
    </div>
  )
}
