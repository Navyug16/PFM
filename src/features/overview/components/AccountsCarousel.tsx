import React, { useState, useRef } from 'react'
import type { Account } from '@/features/financial/types'
import { formatCurrency as sharedFormatCurrency } from '@/features/financial/utils/formatters'
import { Wallet, Landmark, CreditCard, PiggyBank, Coins, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

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
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const formatCurrency = (val: number, curr?: string) => {
    const safeVal = typeof val === 'number' && !isNaN(val) ? val : 0
    return sharedFormatCurrency(safeVal, curr || primaryCurrency, userLocale, {
      maximumFractionDigits: 0
    })
  }

  const safeAccounts = accounts || []
  const mainAvailableBalance = (availableBalance && availableBalance[primaryCurrency]) || 0
  const totalCards = 1 + safeAccounts.length

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
    const match = acc.name.match(/\d{4}$/)
    if (match) return match[0]
    return acc.id.replace(/-/g, '').slice(-4).toUpperCase()
  }

  const renderBankLogo = (bankName: string, accountType: string) => {
    const name = bankName.toLowerCase()
    if (name.includes('hdfc')) {
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-950/80 border border-blue-500/40 text-[9px] font-black text-blue-400 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
          HDFC BANK
        </div>
      )
    }
    if (name.includes('icici')) {
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-orange-950/80 border border-orange-500/40 text-[9px] font-black text-orange-400 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
          ICICI BANK
        </div>
      )
    }
    if (name.includes('sbi') || name.includes('state bank')) {
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-950/80 border border-sky-500/40 text-[9px] font-black text-sky-400 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
          SBI
        </div>
      )
    }
    if (name.includes('axis')) {
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/40 text-[9px] font-black text-rose-400 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          AXIS BANK
        </div>
      )
    }

    const isCredit = accountType === 'credit_card'
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-primary/80 border border-border-neutral/60 text-[9px] font-black italic tracking-widest text-text-primary uppercase">
        {isCredit ? 'MASTERCARD' : 'VISA'}
      </div>
    )
  }

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, clientWidth } = scrollRef.current
    if (clientWidth <= 0) return
    const index = Math.round(scrollLeft / clientWidth)
    setActiveIndex(Math.max(0, Math.min(index, totalCards - 1)))
  }

  return (
    <div className="flex flex-col justify-between h-full space-y-3 bg-surface-primary border border-border-neutral rounded-custom-xl p-5 shadow-sm">
      {/* Top Header: Accounts & Link */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
          Accounts
        </h3>
        <Link
          to="/accounts"
          className="text-xs font-semibold text-brand-orange hover:underline flex items-center gap-1"
        >
          <Plus size={12} /> Add Card
        </Link>
      </div>

      {/* Standalone Digital Bank Cards Carousel */}
      <div className="flex-1 flex flex-col justify-between my-auto space-y-3">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory select-none w-full [&::-webkit-scrollbar]:hidden [ms-overflow-style:none] [scrollbar-width:none]"
        >
          {/* CARD #1: PINNED TOTAL AVAILABLE BALANCE HERO CARD */}
          <div className="w-full shrink-0 snap-center flex flex-col justify-between bg-gradient-to-br from-brand-orange/35 via-surface-secondary to-bg-primary border border-brand-orange/50 rounded-custom-xl p-5 shadow-elevated h-full min-h-[220px] space-y-4 relative overflow-hidden">
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
              <span className="text-[9px] font-black italic tracking-widest text-text-primary uppercase bg-surface-primary/90 px-2 py-0.5 rounded border border-border-neutral/40">
                VISA
              </span>
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
              <div className="flex items-center gap-1.5 font-mono font-bold text-text-secondary tracking-widest text-xs">
                <span>••••</span>
                <span>••••</span>
                <span>••••</span>
                <span className="text-brand-orange">TOTAL</span>
              </div>
              <span className="font-bold text-text-primary uppercase text-[10px]">{primaryCurrency}</span>
            </div>
          </div>

          {/* CARDS #2+: INDIVIDUAL STANDALONE BANK CARDS */}
          {safeAccounts.map((acc) => {
            const IconComponent = getAccountIcon(acc.account_type)
            const last4 = getCardLast4(acc)
            const balance = getAccountBalance(acc)

            return (
              <div
                key={acc.id}
                className="w-full shrink-0 snap-center flex flex-col justify-between bg-gradient-to-br from-surface-secondary via-surface-primary to-bg-primary border border-border-neutral/80 hover:border-brand-orange/40 rounded-custom-xl p-5 shadow-elevated h-full min-h-[220px] space-y-4 transition-all relative overflow-hidden"
              >
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-surface-secondary border border-border-neutral/70 flex items-center justify-center shrink-0">
                      <IconComponent size={15} className="text-brand-orange" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-text-primary uppercase tracking-wider truncate max-w-[130px]">
                        {acc.name}
                      </h4>
                      <span className="text-[9px] font-semibold text-text-muted capitalize">
                        {acc.account_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {renderBankLogo(acc.name, acc.account_type)}
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
                  <div className="flex items-center gap-1.5 font-mono font-bold text-text-secondary tracking-widest text-xs">
                    <span>••••</span>
                    <span>••••</span>
                    <span>••••</span>
                    <span className="text-text-primary">{last4}</span>
                  </div>
                  <span className="text-[9px] font-extrabold text-text-muted uppercase bg-surface-secondary px-2 py-0.5 rounded border border-border-neutral/40">
                    {acc.currency_code}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* CENTERED PAGINATION DOTS (...) */}
        {totalCards > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-1 shrink-0 select-none">
            {Array.from({ length: totalCards }).map((_, idx) => (
              <span
                key={idx}
                className={`inline-block transition-all duration-300 rounded-full ${
                  idx === activeIndex
                    ? 'w-4 h-1.5 bg-brand-orange'
                    : 'w-1.5 h-1.5 bg-border-neutral/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
