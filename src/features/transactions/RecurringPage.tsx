import React, { useState, useEffect } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Calendar, Plus, RefreshCw, Play, Pause, Archive, Trash2, Edit2, Clock, X } from 'lucide-react'
import { useRecurringData } from './hooks/useRecurringData'
import { listAccounts, listCategories } from '../financial/api/financial-api'
import type { Account, Category } from '../financial/types'
import type { RecurringRule } from './types/recurring'
import { RecurringRuleForm } from './components/RecurringRuleForm'
import { formatCurrency } from '@/features/financial/utils/formatters'

export const RecurringPage: React.FC = () => {
  const {
    rules,
    occurrences,
    loading: recurringLoading,
    error: recurringError,
    createRule,
    editRule,
    pauseRule,
    resumeRule,
    archiveRule,
    deleteRule
  } = useRecurringData()

  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [apiLoading, setApiLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)

  // Modals & UI States
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<RecurringRule | null>(null)
  const [activeTab, setActiveTab] = useState<'rules' | 'timeline'>('rules')

  useEffect(() => {
    const fetchMetadata = async () => {
      setApiLoading(true)
      try {
        const [accs, cats] = await Promise.all([listAccounts(), listCategories()])
        setAccounts(accs)
        setCategories(cats)
      } catch (err) {
        setApiError(err instanceof Error ? err.message : 'Failed to fetch settings context')
      } finally {
        setApiLoading(false)
      }
    }
    fetchMetadata()
  }, [])

  const handleCreateOrUpdate = async (ruleData: Parameters<typeof createRule>[0]) => {
    if (selectedRule) {
      await editRule(selectedRule.id, ruleData)
    } else {
      await createRule(ruleData)
    }
    setIsFormOpen(false)
    setSelectedRule(null)
  }

  const handleEditClick = (rule: RecurringRule) => {
    setSelectedRule(rule);
    setIsFormOpen(true);
  }

  const handleDeleteClick = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this recurring rule?')) return
    try {
      await deleteRule(id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const handleArchiveClick = async (id: string) => {
    if (!confirm('Are you sure you want to archive this rule? All future occurrences will be cancelled, but confirmed transactions will remain unchanged.')) return
    try {
      await archiveRule(id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Archive failed')
    }
  }


  const loading = recurringLoading || apiLoading
  const error = recurringError || apiError

  const pendingOccurrences = occurrences.filter((o) => o.status === 'pending')

  return (
    <PageContainer>
      <div className="flex justify-between items-center">
        <PageHeader
          title="Recurring Transactions"
          description="Schedule template rules to confirm expected income and expenses."
        />
        <button
          onClick={() => {
            setSelectedRule(null)
            setIsFormOpen(true)
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-purple hover:bg-brand-purple/90 text-text-primary text-xs font-semibold rounded-custom-md cursor-pointer transition-all shrink-0"
        >
          <Plus size={16} /> Create Rule
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex border-b border-border-neutral gap-6 text-sm font-semibold select-none">
        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 transition-all cursor-pointer ${
            activeTab === 'rules'
              ? 'text-brand-purple border-b-2 border-brand-purple'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Active Rules ({rules.length})
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`pb-3 transition-all cursor-pointer ${
            activeTab === 'timeline'
              ? 'text-brand-purple border-b-2 border-brand-purple'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Expected Timeline ({pendingOccurrences.length})
        </button>
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center py-8">
          <RefreshCw size={24} className="animate-spin text-brand-purple" />
        </div>
      ) : error ? (
        <div className="mt-12 p-4 bg-state-expense/10 border border-state-expense/20 text-state-expense text-sm rounded-custom-md max-w-xl mx-auto flex items-center gap-2">
          <span>{error}</span>
        </div>
      ) : activeTab === 'rules' && rules.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            icon={<Calendar size={32} />}
            title="No Recurring Rules Set Up"
            description="Create template schedules to track predictable payments like rent, salaries, and subscriptions."
            actionLabel="Setup First Rule"
            onAction={() => {
              setSelectedRule(null)
              setIsFormOpen(true)
            }}
          />
        </div>
      ) : (
        <div className="mt-8">
          {activeTab === 'rules' ? (
            <div className="bg-surface-primary border border-border-neutral rounded-custom-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-surface-secondary border-b border-border-neutral text-text-secondary text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Rule Name</th>
                    <th className="px-6 py-4">Frequencies</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Next Due Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-neutral">
                  {rules.map((rule) => {
                    const accName = accounts.find((a) => a.id === rule.account_id)?.name || 'Deleted Account'
                    const catName = categories.find((c) => c.id === rule.category_id)?.name || 'Uncategorized'

                    return (
                      <tr key={rule.id} className="hover:bg-surface-secondary/50 text-text-primary">
                        <td className="px-6 py-4 font-semibold">
                          <div>
                            <div>{rule.name}</div>
                            <div className="text-[10px] text-text-secondary font-normal mt-0.5">
                              {accName} • {catName}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 capitalize">{rule.frequency}</td>
                        <td className={`px-6 py-4 font-bold ${rule.transaction_type === 'income' ? 'text-state-positive' : 'text-text-primary'}`}>
                          {rule.transaction_type === 'income' ? '+' : '-'}{formatCurrency(rule.amount)}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">{rule.next_due_date}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded-custom-full font-semibold border ${
                            rule.is_active
                              ? 'bg-state-positive/10 border-state-positive/20 text-state-positive'
                              : 'bg-text-secondary/15 border-border-neutral text-text-secondary'
                          }`}>
                            {rule.is_active ? 'Active' : 'Paused'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2 h-full">
                          {rule.is_active ? (
                            <button
                              onClick={() => pauseRule(rule.id)}
                              title="Pause Schedule"
                              className="p-1.5 hover:bg-surface-secondary rounded-custom-md text-text-secondary hover:text-text-primary cursor-pointer transition-all"
                            >
                              <Pause size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => resumeRule(rule.id, rule)}
                              title="Resume Schedule"
                              className="p-1.5 hover:bg-surface-secondary rounded-custom-md text-text-secondary hover:text-state-positive cursor-pointer transition-all"
                            >
                              <Play size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleEditClick(rule)}
                            title="Edit Rule"
                            className="p-1.5 hover:bg-surface-secondary rounded-custom-md text-text-secondary hover:text-brand-purple cursor-pointer transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleArchiveClick(rule.id)}
                            title="Archive Rule"
                            className="p-1.5 hover:bg-surface-secondary rounded-custom-md text-text-secondary hover:text-state-expense cursor-pointer transition-all"
                          >
                            <Archive size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(rule.id)}
                            title="Delete Rule"
                            className="p-1.5 hover:bg-surface-secondary rounded-custom-md text-text-secondary hover:text-state-expense cursor-pointer transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : pendingOccurrences.length === 0 ? (
            <div className="text-center py-12 bg-surface-primary border border-border-neutral rounded-custom-xl">
              <Clock size={40} className="mx-auto text-text-secondary animate-pulse" />
              <h3 className="text-sm font-bold text-text-primary mt-3">No Upcoming Payments Expected</h3>
              <p className="text-xs text-text-secondary mt-1 max-w-xs mx-auto">
                Any occurrences generated from active schedule templates will appear here as they approach.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingOccurrences.map((occ) => {
                  const isOverdue = occ.due_date < new Date().toISOString().split('T')[0]
                  const isToday = occ.due_date === new Date().toISOString().split('T')[0]

                  return (
                    <div key={occ.id} className="bg-surface-primary border border-border-neutral rounded-custom-xl p-4 flex flex-col justify-between shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-text-primary">{occ.rule_name}</h4>
                          <p className="text-xs text-text-secondary mt-0.5">
                            Due: {occ.due_date} | Account: {occ.account_name} | Category: {occ.category_name}
                          </p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-custom-full font-bold uppercase ${
                          isOverdue
                            ? 'bg-state-expense/10 text-state-expense border border-state-expense/25'
                            : isToday
                            ? 'bg-brand-purple/10 text-brand-purple border border-brand-purple/25'
                            : 'bg-surface-secondary text-text-secondary border border-border-neutral'
                        }`}>
                          {isOverdue ? 'Overdue' : isToday ? 'Due Today' : 'Upcoming'}
                        </span>
                      </div>
                      <div className="mt-4 flex justify-between items-center border-t border-border-neutral pt-3">
                        <span className="text-sm font-bold text-text-primary">
                          {occ.rule_type === 'income' ? '+' : '-'}{formatCurrency(occ.expected_amount)}
                        </span>
                        <div className="text-[10px] text-text-secondary italic">
                          Confirm via Daily Money Check on Overview
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal Sheet */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-6 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-bold text-text-primary">
                {selectedRule ? 'Edit Recurring Schedule Rule' : 'Setup New Recurring Schedule'}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 hover:bg-surface-secondary rounded-custom-md text-text-secondary hover:text-text-primary transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <RecurringRuleForm
              initialRule={selectedRule}
              accounts={accounts}
              categories={categories}
              onSubmit={handleCreateOrUpdate}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </div>
      )}
    </PageContainer>
  )
}
export default RecurringPage;
