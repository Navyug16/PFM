import React, { useState, useEffect, useCallback } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Receipt, Plus, RefreshCw, Trash2, Tag, Search, Filter } from 'lucide-react'
import {
  listTransactions,
  deleteTransaction,
  listAccounts,
  listCategories,
  listTags,
  createTag,
  attachTagToTransaction
} from '../financial/api/financial-api'
import {
  calculatePeriodIncome,
  calculatePeriodExpenses,
  calculatePeriodSavings,
  calculateSavingsRate
} from '../financial/utils/calculations'
import type { Account, Category, Transaction, TransactionType, Tag as DomainTag } from '../financial/types'
import { TransactionForm } from '@/components/financial/TransactionForm'

export const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<DomainTag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtering State
  const [filterAccount, setFilterAccount] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterSearch, setFilterSearch] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  // Tag Attachment State
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null)
  const [newTagName, setNewTagName] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [accData, catData, tagData] = await Promise.all([
        listAccounts(),
        listCategories(),
        listTags()
      ])
      
      setAccounts(accData)
      setCategories(catData)
      setTags(tagData)

      // Fetch filtered transactions
      const txData = await listTransactions({
        accountId: filterAccount || undefined,
        categoryId: filterCategory || undefined,
        type: (filterType as TransactionType) || undefined,
        search: filterSearch || undefined,
        dateFrom: filterDateFrom || undefined,
        dateTo: filterDateTo || undefined
      })
      setTransactions(txData)
    } catch (err: unknown) {
      console.error('Error fetching transactions details:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch transaction records.')
    } finally {
      setLoading(false)
    }
  }, [filterAccount, filterCategory, filterType, filterSearch, filterDateFrom, filterDateTo])

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

  // Delete Operation

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction record?')) return
    try {
      await deleteTransaction(id)
      await fetchData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete transaction.')
    }
  }

  // Tags Operations
  const handleCreateAndAttachTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTxId || !newTagName.trim()) return

    try {
      // Find if tag already exists or create it
      let tagObj = tags.find((t) => t.name.toLowerCase() === newTagName.trim().toLowerCase())
      if (!tagObj) {
        tagObj = await createTag(newTagName.trim())
      }
      await attachTagToTransaction(selectedTxId, tagObj.id)
      setNewTagName('')
      setSelectedTxId(null)
      await fetchData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to attach tag.')
    }
  }


  // Calculations for Period Summary (using filtered dataset)
  const incomeTotal = calculatePeriodIncome(transactions)
  const expenseTotal = calculatePeriodExpenses(transactions)
  const savingsTotal = calculatePeriodSavings(transactions)
  const rateTotal = calculateSavingsRate(incomeTotal, expenseTotal)

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(val)
  }

  return (
    <PageContainer>
      <PageHeader
        title="Transactions"
        description="Log income, expenses, and account transfers."
      />

      {/* Summary Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-primary border border-border-neutral rounded-custom-lg p-5">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">
            Total Income
          </p>
          <p className="text-xl font-bold text-state-positive mt-1">
            {formatCurrency(incomeTotal)}
          </p>
        </div>
        <div className="bg-surface-primary border border-border-neutral rounded-custom-lg p-5">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">
            Total Expenses
          </p>
          <p className="text-xl font-bold text-state-expense mt-1">
            {formatCurrency(expenseTotal)}
          </p>
        </div>
        <div className="bg-surface-primary border border-border-neutral rounded-custom-lg p-5">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">
            Total Savings
          </p>
          <p className={`text-xl font-bold mt-1 ${savingsTotal >= 0 ? 'text-state-positive' : 'text-state-expense'}`}>
            {formatCurrency(savingsTotal)}
          </p>
        </div>
        <div className="bg-surface-primary border border-border-neutral rounded-custom-lg p-5">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">
            Savings Rate
          </p>
          <p className="text-xl font-bold text-brand-purple mt-1">
            {rateTotal.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Input Form Card */}
        <div className="bg-surface-primary border border-border-neutral rounded-custom-lg p-6 h-fit">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <Plus size={18} className="text-brand-purple" /> Log Transaction
          </h3>

          <TransactionForm
            accounts={accounts}
            categories={categories}
            onSuccess={fetchData}
          />
        </div>

        {/* Transaction History Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Filters Dashboard */}
          <div className="bg-surface-primary border border-border-neutral rounded-custom-lg p-5">
            <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
              <Filter size={16} className="text-brand-purple" /> Filter Results
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search notes/payee"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md pl-9 pr-4 py-2 text-xs text-text-primary outline-none focus:border-brand-purple"
                />
              </div>

              <select
                value={filterAccount}
                onChange={(e) => setFilterAccount(e.target.value)}
                className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-3 py-2 text-xs text-text-primary outline-none focus:border-brand-purple"
              >
                <option value="">All Accounts</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-3 py-2 text-xs text-text-primary outline-none focus:border-brand-purple"
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="transfer">Transfer</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-3 py-2 text-xs text-text-primary outline-none focus:border-brand-purple"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name} ({cat.transaction_type})</option>
                ))}
              </select>

              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-3 py-2 text-xs text-text-primary outline-none focus:border-brand-purple"
              />
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-3 py-2 text-xs text-text-primary outline-none focus:border-brand-purple"
              />
            </div>
          </div>

          {/* Inline Tag Attachment Dialog */}
          {selectedTxId && (
            <div className="p-4 bg-surface-primary border border-brand-purple rounded-custom-lg flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs text-text-secondary mb-2 font-semibold">Attach tag to selected transaction:</p>
                <form onSubmit={handleCreateAndAttachTag} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Taxes, Travel"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="flex-1 bg-surface-secondary border border-border-neutral rounded-custom-md px-3 py-1.5 text-xs text-text-primary outline-none focus:border-brand-purple"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-text-primary text-xs font-semibold rounded-custom-md cursor-pointer border-none"
                  >
                    Attach
                  </button>
                </form>
              </div>
              <button
                onClick={() => setSelectedTxId(null)}
                className="text-text-muted hover:text-text-primary text-xs cursor-pointer border-none bg-transparent"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Transactions List */}
          {loading ? (
            <div className="flex items-center justify-center p-12 text-text-secondary gap-2">
              <RefreshCw size={18} className="animate-spin" />
              <span>Loading ledger entries...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-state-expense/10 border border-state-expense/20 text-state-expense rounded-custom-md text-sm text-center">
              {error}
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              title="No Entries Found"
              description="Log income, expenses, or transfers to build your financial history."
              icon={<Receipt size={32} className="text-brand-purple" />}
            />
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const acc = accounts.find((a) => a.id === tx.account_id)
                const destAcc = tx.transfer_to_account_id ? accounts.find((a) => a.id === tx.transfer_to_account_id) : null
                const cat = categories.find((c) => c.id === tx.category_id)

                return (
                  <div
                    key={tx.id}
                    className="bg-surface-primary border border-border-neutral rounded-custom-lg p-4 flex items-center justify-between hover:border-text-muted transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-custom-md border ${
                        tx.transaction_type === 'income'
                          ? 'bg-state-positive/10 text-state-positive border-state-positive/20'
                          : tx.transaction_type === 'expense'
                          ? 'bg-state-expense/10 text-state-expense border-state-expense/20'
                          : 'bg-brand-purple/10 text-brand-purple border-brand-purple/20'
                      }`}>
                        <Receipt size={18} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-text-primary text-sm">
                          {tx.payee_or_source || (tx.transaction_type === 'transfer' ? 'Internal Transfer' : 'Unspecified')}
                        </h4>
                        <p className="text-xs text-text-secondary mt-1">
                          {tx.transaction_date} | {acc?.name}
                          {tx.transaction_type === 'transfer' && destAcc && ` → ${destAcc.name}`}
                          {cat && ` | Category: ${cat.name}`}
                        </p>
                        {tx.notes && (
                          <p className="text-xs text-text-muted italic mt-1">
                            Note: {tx.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`font-bold text-sm ${
                          tx.transaction_type === 'income'
                            ? 'text-state-positive'
                            : tx.transaction_type === 'expense'
                            ? 'text-state-expense'
                            : 'text-brand-purple'
                        }`}>
                          {tx.transaction_type === 'expense' ? '-' : tx.transaction_type === 'income' ? '+' : ''}
                          {formatCurrency(tx.amount)}
                        </p>
                        <p className="text-[10px] text-text-muted mt-0.5 capitalize">
                          {tx.transaction_type}
                        </p>
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => setSelectedTxId(tx.id)}
                          title="Attach Tag"
                          className="p-1.5 text-text-secondary hover:text-brand-purple hover:bg-surface-secondary rounded cursor-pointer border-none bg-transparent"
                        >
                          <Tag size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          title="Delete Transaction"
                          className="p-1.5 text-text-secondary hover:text-state-expense hover:bg-surface-secondary rounded cursor-pointer border-none bg-transparent"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
