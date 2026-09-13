import React, { useState } from 'react'
import type { Account } from '@/features/financial/types'
import { formatCurrency as sharedFormatCurrency } from '@/features/financial/utils/formatters'
import { Wallet, Landmark, CreditCard, PiggyBank, Coins, Eye, EyeOff } from 'lucide-react'

interface AccountsCarouselProps {
  availableBalance: { [currency: string]: number }
  accounts: Account[]
  primaryCurrency?: string
  userLocale?: string
}

export const AccountsCarousel: React.FC<AccountsCarouselProps> = ({
  availableBalance,
  accounts,
  primaryCurrency = 'INR',
  userLocale = 'en-IN'
}) => {
  const [visibleAccNumbers, setVisibleAccNumbers] = useState<{ [id: string]: boolean }>({})

  const toggleVisibility = (accId: string) => {
    setVisibleAccNumbers((prev) => ({
      ...prev,
      [accId]: !prev[accId]
    }))
  }

  const formatCurrency = (val: number, curr?: string) => {
    const safeVal = typeof val === 'number' && !isNaN(val) ? val : 0
    return sharedFormatCurrency(safeVal, curr || primaryCurrency, userLocale, {
      maximumFractionDigits: 0
    })
  }

  const safeAccounts = accounts || []
  const mainAvailableBalance = (availableBalance && availableBalance[primaryCurrency]) || 0

  const getAccountIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'bank':
        return Landmark
      case 'credit_card':
      case 'credit':
        return CreditCard
      case 'investment':
        return PiggyBank
      case 'wallet':
      case 'cash':
        return Coins
      default:
        return Wallet
    }
  }

  const getAccountBalance = (acc: Account) => {
    const rawAcc = acc as unknown as { current_balance?: number; balance?: number }
    if (typeof rawAcc.current_balance === 'number' && !isNaN(rawAcc.current_balance)) {
      return rawAcc.current_balance
    }
    if (typeof rawAcc.balance === 'number' && !isNaN(rawAcc.balance)) {
      return rawAcc.balance
    }
    if (typeof acc.opening_balance === 'number' && !isNaN(acc.opening_balance)) {
      return acc.opening_balance
    }
    return 0
  }

  const getCardLast4 = (acc: Account) => {
    if (acc.account_number && acc.account_number.trim().length > 0) {
      const cleaned = acc.account_number.replace(/\s+/g, '')
      if (cleaned.length >= 4) return cleaned.slice(-4)
    }
    const match = acc.name.match(/\d{4}$/)
    if (match) return match[0]
    return acc.id.replace(/-/g, '').slice(-4).toUpperCase()
  }

  const getDisplayAccountNumber = (acc: Account, isVisible: boolean) => {
    const last4 = getCardLast4(acc)
    const rawNum = acc.account_number ? acc.account_number.replace(/\s+/g, '') : ''

    if (isVisible) {
      if (rawNum.length > 0) {
        return rawNum.replace(/(.{4})/g, '$1 ').trim()
      }
      return `•••• •••• •••• ${last4}`
    }

    return `•••• •••• •••• ${last4}`
  }



  return (
    <div className="flex flex-col justify-between h-full space-y-3">
      {/* Top Header: Accounts */}
      <div className="flex items-center justify-between px-0.5">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
          Accounts
        </h3>
      </div>

      {/* Standalone Digital Bank Cards Carousel */}
      <div className="flex-1 flex flex-col justify-between h-full space-y-3">
        <div className="flex overflow-x-auto snap-x snap-mandatory select-none w-full h-full min-h-[260px] [&::-webkit-scrollbar]:hidden [ms-overflow-style:none] [scrollbar-width:none]">
          {/* CARD #1: PINNED TOTAL AVAILABLE BALANCE HERO CARD */}
          <div className="w-full shrink-0 snap-center flex flex-col justify-between bg-gradient-to-br from-brand-orange/35 via-surface-secondary to-bg-primary border border-brand-orange/50 rounded-custom-xl p-5 shadow-elevated h-full min-h-[260px] space-y-4 relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-brand-orange/15 blur-xl pointer-events-none" />

            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-brand-orange/15 border border-brand-orange/40 flex items-center justify-center">
                  <Wallet size={15} className="text-brand-orange" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-text-primary uppercase tracking-wider">
                    Total Liquidity
                  </h4>
                  <span className="text-[9px] font-semibold text-brand-orange uppercase">All Accounts</span>
                </div>
              </div>
            </div>

            <div className="z-10 my-auto space-y-1 py-1">
              <span className="text-xs font-bold text-text-secondary block uppercase tracking-wider">
                Available Balance
              </span>
              <p className="text-3xl font-extrabold text-text-primary tracking-tight tabular-nums mt-1">
                {formatCurrency(mainAvailableBalance)}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-text-muted z-10 pt-2 border-t border-border-neutral/40">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                Net Liquidity Pool
              </span>
              <span className="font-bold text-text-primary uppercase text-[10px] bg-surface-primary/90 px-2 py-0.5 rounded border border-border-neutral/40">
                {primaryCurrency}
              </span>
            </div>
          </div>

          {/* CARDS #2+: INDIVIDUAL STANDALONE BANK CARDS */}
          {safeAccounts.map((acc) => {
            const IconComponent = getAccountIcon(acc.account_type)
            const balance = getAccountBalance(acc)
            const isNumVisible = !!visibleAccNumbers[acc.id]

            return (
              <div
                key={acc.id}
                className="w-full shrink-0 snap-center flex flex-col justify-between bg-gradient-to-br from-surface-secondary via-surface-primary to-bg-primary border border-border-neutral/80 hover:border-brand-orange/40 rounded-custom-xl p-5 shadow-elevated h-full min-h-[260px] space-y-4 transition-all relative overflow-hidden"
              >
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-surface-secondary border border-border-neutral/70 flex items-center justify-center shrink-0">
                      <IconComponent size={15} className="text-brand-orange" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-text-primary uppercase tracking-wider truncate max-w-[170px]">
                        {acc.name}
                      </h4>
                      <span className="text-[9px] font-semibold text-text-muted capitalize">
                        {acc.account_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="z-10 my-auto space-y-1 py-1">
                  <span className="text-xs font-bold text-text-secondary block uppercase tracking-wider">
                    Available Balance
                  </span>
                  <p className="text-3xl font-extrabold text-text-primary tabular-nums tracking-tight mt-1">
                    {formatCurrency(balance, acc.currency_code)}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-border-neutral/40 z-10">
                  <div className="flex items-center gap-2">
                    <div className="font-mono font-bold text-text-secondary tracking-wider text-xs">
                      {getDisplayAccountNumber(acc, isNumVisible)}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleVisibility(acc.id)
                      }}
                      className="text-text-muted hover:text-brand-orange transition-colors cursor-pointer border-none bg-transparent p-0.5 rounded flex items-center"
                      aria-label={isNumVisible ? 'Hide account number' : 'Show account number'}
                      title={isNumVisible ? 'Hide full number' : 'Show full number'}
                    >
                      {isNumVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <span className="text-[9px] font-extrabold text-text-muted uppercase bg-surface-secondary px-2 py-0.5 rounded border border-border-neutral/40">
                    {acc.currency_code}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

