import React, { useState, useEffect, useCallback } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Landmark, Trash2, Archive, Plus, AlertCircle, RefreshCw } from 'lucide-react'
import {
  listAccounts,
  createAccount,
  archiveAccount,
  deleteAccount,
  listTransactions
} from '../financial/api/financial-api'
import { validateAccount } from '../financial/validation'
import { calculateAccountBalance, calculateTotalAccountBalance } from '../financial/utils/calculations'
import type { Account, Transaction, AccountType } from '../financial/types'
import { formatCurrency as sharedFormatCurrency } from '@/features/financial/utils/formatters'

export const AccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('checking')
  const [currency, setCurrency] = useState('INR')
  const [openingBalance, setOpeningBalance] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [accData, txData] = await Promise.all([listAccounts(), listTransactions()])
      setAccounts(accData)
      setTransactions(txData)
    } catch (err: unknown) {
      console.error('Error fetching accounts data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch financial data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    const run = async () => {
      await Promise.resolve()
      if (active) {
        fetchData()
      }
    }
    run()
    return () => {
      active = false
    }
  }, [fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const balanceNum = parseFloat(openingBalance) || 0
    const validationErr = validateAccount(name, type, currency, balanceNum)
    if (validationErr) {
      setFormError(validationErr)
      return
    }

    setActionLoading(true)
    try {
      await createAccount({
        name: name.trim(),
        account_type: type,
        currency_code: currency.toUpperCase().trim(),
        opening_balance: balanceNum,
        is_active: true,
      })
      setName('')
      setOpeningBalance('')
      await fetchData()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create account.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to archive this account?')) return
    setActionLoading(true)
    try {
      await archiveAccount(id)
      await fetchData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to archive account.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this account?')) return
    setActionLoading(true)
    try {
      await deleteAccount(id)
      await fetchData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete account.')
    } finally {
      setActionLoading(false)
    }
  }

  // Calculate Net Position
  const totals = calculateTotalAccountBalance(accounts, transactions)
  const formatCurrency = (val: number, code: string) => sharedFormatCurrency(val, code)

  return (
    <PageContainer>
      <PageHeader
        title="Accounts"
        description="Manage your bank accounts, credit cards, and cash assets."
      />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Creation Form */}
        <div className="bg-surface-primary border border-border-neutral rounded-custom-lg p-6 h-fit">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <Plus size={18} className="text-brand-purple" /> Create Account
          </h3>

          {formError && (
            <div className="mb-4 p-3 bg-state-expense/10 border border-state-expense/20 text-state-expense rounded-custom-md flex items-start gap-2 text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="acc-name" className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
                Account Name
              </label>
              <input
                id="acc-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. HDFC Checking"
                disabled={actionLoading}
                className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2.5 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
              />
            </div>

            <div>
              <label htmlFor="acc-type" className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
                Account Type
              </label>
              <select
                id="acc-type"
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                disabled={actionLoading}
                className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2.5 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="cash">Cash</option>
                <option value="credit_card">Credit Card (Liability)</option>
                <option value="loan">Loan (Liability)</option>
                <option value="investment">Investment</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="acc-curr" className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
                  Currency
                </label>
                <input
                  id="acc-curr"
                  type="text"
                  maxLength={3}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="INR"
                  disabled={actionLoading}
                  className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2.5 text-text-primary text-sm outline-none focus:border-brand-purple transition-all uppercase"
                />
              </div>

              <div>
                <label htmlFor="acc-bal" className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
                  Opening Balance
                </label>
                <input
                  id="acc-bal"
                  type="number"
                  step="0.01"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="0.00"
                  disabled={actionLoading}
                  className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2.5 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-2.5 bg-brand-purple hover:bg-brand-purple/90 text-text-primary font-medium text-sm rounded-custom-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {actionLoading ? 'Saving...' : 'Add Account'}
            </button>
          </form>
        </div>

        {/* Account Lists & Balances */}
        <div className="lg:col-span-2 space-y-6">
          {/* Net Position Header */}
          <div className="bg-surface-primary border border-border-neutral rounded-custom-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                Net Financial Position
              </h3>
              <p className="text-xs text-text-muted mt-1">
                Asset account balances minus credit card and loan debt.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {Object.keys(totals).length === 0 ? (
                <span className="text-2xl font-bold text-text-primary">₹0.00</span>
              ) : (
                Object.entries(totals).map(([curr, amt]) => (
                  <span key={curr} className={`text-2xl font-bold ${amt >= 0 ? 'text-state-positive' : 'text-state-expense'}`}>
                    {formatCurrency(amt, curr)}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Accounts List */}
          {loading ? (
            <div className="flex items-center justify-center p-12 text-text-secondary gap-2">
              <RefreshCw size={18} className="animate-spin" />
              <span>Loading accounts...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-state-expense/10 border border-state-expense/20 text-state-expense rounded-custom-md text-sm text-center">
              {error}
            </div>
          ) : accounts.length === 0 ? (
            <EmptyState
              title="No Accounts Found"
              description="Create your first account on the left to start tracking assets and liabilities."
              icon={<Landmark size={32} className="text-brand-purple" />}
            />
          ) : (
            <div className="space-y-4">
              {accounts.map((acc) => {
                const balance = calculateAccountBalance(acc, transactions)
                const isLiability = acc.account_type === 'credit_card' || acc.account_type === 'loan'

                return (
                  <div
                    key={acc.id}
                    className={`bg-surface-primary border rounded-custom-lg p-5 flex items-center justify-between transition-all hover:border-text-muted ${
                      acc.is_active ? 'border-border-neutral' : 'border-border-neutral opacity-50 bg-surface-secondary'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-surface-secondary rounded-custom-md text-brand-purple border border-border-neutral">
                        <Landmark size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-text-primary flex items-center gap-2">
                          {acc.name}
                          {!acc.is_active && (
                            <span className="text-[10px] bg-surface-secondary text-text-secondary px-2 py-0.5 rounded border border-border-neutral uppercase font-medium">
                              Archived
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-text-secondary capitalize mt-1">
                          Type: {acc.account_type.replace('_', ' ')} | Currency: {acc.currency_code}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className={`font-bold text-lg ${balance >= 0 ? 'text-state-positive' : 'text-state-expense'}`}>
                          {formatCurrency(balance, acc.currency_code)}
                        </p>
                        <p className="text-[10px] text-text-muted mt-0.5 uppercase tracking-wider font-semibold">
                          {isLiability ? 'Liability Debt' : 'Asset Value'}
                        </p>
                      </div>

                      {acc.is_active && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleArchive(acc.id)}
                            title="Archive Account"
                            disabled={actionLoading}
                            className="p-2 text-text-secondary hover:text-brand-purple hover:bg-surface-secondary rounded transition-colors cursor-pointer border-none bg-transparent"
                          >
                            <Archive size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(acc.id)}
                            title="Delete Account"
                            disabled={actionLoading}
                            className="p-2 text-text-secondary hover:text-state-expense hover:bg-surface-secondary rounded transition-colors cursor-pointer border-none bg-transparent"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </PageContainer>
  )
}
