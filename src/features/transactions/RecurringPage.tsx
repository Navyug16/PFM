import React, { useState, useEffect, useMemo } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  Calendar,
  Plus,
  RefreshCw,
  Play,
  Pause,
  Archive,
  Trash2,
  Edit2,
  Clock,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingDown
} from 'lucide-react'
import { useRecurringData } from './hooks/useRecurringData'
import { listAccounts, listCategories } from '../financial/api/financial-api'
import type { Account, Category } from '../financial/types'
import type { RecurringRule } from './types/recurring'
import { calculateMonthlyCommitment, getDerivedOccurrenceState } from './types/recurring'
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
    deleteRule,
    confirmOccurrence,
    skipOccurrence
  } = useRecurringData()

  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [apiLoading, setApiLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)

  // Modals & UI States
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<RecurringRule | null>(null)
  const [activeTab, setActiveTab] = useState<'action_center' | 'schedules'>('action_center')
  const [scheduleFilter, setScheduleFilter] = useState<'all' | 'active' | 'paused' | 'archived'>('all')

  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetadata = async () => {
      setApiLoading(true)
      try {
        const [accs, cats] = await Promise.all([listAccounts(), listCategories()])
        setAccounts(accs)
        setCategories(cats)
      } catch (err) {
        setApiError(err instanceof Error ? err.message : 'Failed to fetch account/category metadata')
      } finally {
        setApiLoading(false)
      }
    }
    fetchMetadata()
  }, [])

  const handleCreateOrUpdate = async (ruleData: Parameters<typeof createRule>[0]) => {
    try {
      if (selectedRule) {
        await editRule(selectedRule.id, ruleData)
        setActionMessage({ type: 'success', message: 'Recurring schedule updated successfully.' })
      } else {
        await createRule(ruleData)
        setActionMessage({ type: 'success', message: 'New recurring schedule created.' })
      }
      setIsFormOpen(false)
      setSelectedRule(null)
    } catch (err) {
      setActionMessage({ type: 'error', message: err instanceof Error ? err.message : 'Failed to save recurring schedule.' })
    }
  }

  const handleEditClick = (rule: RecurringRule) => {
    setSelectedRule(rule)
    setIsFormOpen(true)
  }

  const handleDeleteClick = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this recurring rule?')) return
    setActionInProgressId(id)
    try {
      await deleteRule(id)
      setActionMessage({ type: 'success', message: 'Schedule permanently deleted.' })
    } catch (err) {
      setActionMessage({ type: 'error', message: err instanceof Error ? err.message : 'Delete failed' })
    } finally {
      setActionInProgressId(null)
    }
  }

  const handleArchiveClick = async (id: string) => {
    if (!confirm('Archive this schedule? Future reminders will stop generating, but historical transactions remain.')) return
    setActionInProgressId(id)
    try {
      await archiveRule(id)
      setActionMessage({ type: 'success', message: 'Schedule archived.' })
    } catch (err) {
      setActionMessage({ type: 'error', message: err instanceof Error ? err.message : 'Archive failed' })
    } finally {
      setActionInProgressId(null)
    }
  }

  const handleConfirmAction = async (occurrenceId: string) => {
    setActionInProgressId(occurrenceId)
    try {
      await confirmOccurrence(occurrenceId)
      setActionMessage({ type: 'success', message: 'Payment confirmed! Transaction recorded in account.' })
    } catch (err) {
      setActionMessage({ type: 'error', message: err instanceof Error ? err.message : 'Unable to confirm payment.' })
    } finally {
      setActionInProgressId(null)
    }
  }

  const handleSkipAction = async (occurrenceId: string) => {
    setActionInProgressId(occurrenceId)
    try {
      await skipOccurrence(occurrenceId)
      setActionMessage({ type: 'success', message: 'Payment reminder skipped.' })
    } catch (err) {
      setActionMessage({ type: 'error', message: err instanceof Error ? err.message : 'Unable to skip reminder.' })
    } finally {
      setActionInProgressId(null)
    }
  }

  const loading = recurringLoading || apiLoading
  const error = recurringError || apiError
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  // 1. Calculations for Reliable Metrics
  const monthlyCommitment = useMemo(() => {
    return rules
      .filter((r) => r.is_active && !r.archived_at && r.transaction_type === 'expense')
      .reduce((sum, r) => sum + calculateMonthlyCommitment(r.amount, r.frequency), 0)
  }, [rules])

  const actionRequiredCount = useMemo(() => {
    return occurrences.filter((o) => o.status === 'pending' && o.due_date <= todayStr).length
  }, [occurrences, todayStr])

  const sevenDayCashOutflow = useMemo(() => {
    const next7DaysObj = new Date()
    next7DaysObj.setDate(next7DaysObj.getDate() + 7)
    const next7DaysStr = next7DaysObj.toISOString().split('T')[0]

    return occurrences
      .filter((o) => o.status === 'pending' && o.due_date >= todayStr && o.due_date <= next7DaysStr && o.rule_type === 'expense')
      .reduce((sum, o) => sum + o.expected_amount, 0)
  }, [occurrences, todayStr])

  // 2. Sort Occurrences for Action Center: Overdue -> Due Today -> Upcoming -> Confirmed/Skipped
  const sortedOccurrences = useMemo(() => {
    return [...occurrences].sort((a, b) => {
      const stateA = getDerivedOccurrenceState(a.due_date, a.status, todayStr)
      const stateB = getDerivedOccurrenceState(b.due_date, b.status, todayStr)

      const weightMap: Record<string, number> = {
        overdue: 1,
        due_today: 2,
        upcoming: 3,
        confirmed: 4,
        skipped: 5
      }

      const wA = weightMap[stateA] || 99
      const wB = weightMap[stateB] || 99

      if (wA !== wB) return wA - wB
      return a.due_date.localeCompare(b.due_date)
    })
  }, [occurrences, todayStr])

  // 3. Filtered Schedules for Schedule Manager
  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      if (scheduleFilter === 'active') return r.is_active && !r.archived_at
      if (scheduleFilter === 'paused') return !r.is_active && !r.archived_at
      if (scheduleFilter === 'archived') return Boolean(r.archived_at)
      return true
    })
  }, [rules, scheduleFilter])

  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <PageHeader
          title="Recurring Schedules & Bills"
          description="Manage predictable payments, subscriptions, and expected income."
        />
        <button
          onClick={() => {
            setSelectedRule(null)
            setIsFormOpen(true)
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-orange hover:bg-brand-orange-hover text-text-primary text-xs font-semibold rounded-custom-md cursor-pointer transition-all shrink-0 min-h-[44px]"
        >
          <Plus size={16} /> New Schedule
        </button>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          className={`mt-4 p-3 rounded-custom-md border text-xs flex items-center justify-between transition-all ${
            actionMessage.type === 'success'
              ? 'bg-state-positive/10 border-state-positive/30 text-state-positive'
              : 'bg-state-expense/10 border-state-expense/30 text-state-expense'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{actionMessage.message}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="p-1 hover:opacity-75 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-primary border border-border-neutral rounded-custom-lg p-4">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <TrendingDown size={14} className="text-brand-orange" /> Monthly Commitment
          </p>
          <p className="text-lg font-bold text-text-primary mt-1">{formatCurrency(monthlyCommitment)}</p>
          <p className="text-[10px] text-text-secondary mt-0.5">Sum of active recurring expenses</p>
        </div>

        <div className="bg-surface-primary border border-border-neutral rounded-custom-lg p-4">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle size={14} className={actionRequiredCount > 0 ? 'text-state-expense' : 'text-state-positive'} /> Action Required
          </p>
          <p className={`text-lg font-bold mt-1 ${actionRequiredCount > 0 ? 'text-state-expense' : 'text-state-positive'}`}>
            {actionRequiredCount} {actionRequiredCount === 1 ? 'Payment' : 'Payments'}
          </p>
          <p className="text-[10px] text-text-secondary mt-0.5">Overdue or due today</p>
        </div>

        <div className="bg-surface-primary border border-border-neutral rounded-custom-lg p-4">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={14} className="text-brand-orange" /> 7-Day Outflow Forecast
          </p>
          <p className="text-lg font-bold text-text-primary mt-1">{formatCurrency(sevenDayCashOutflow)}</p>
          <p className="text-[10px] text-text-secondary mt-0.5">Expected in next 7 days</p>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="mt-8 flex border-b border-border-neutral gap-6 text-sm font-semibold select-none">
        <button
          onClick={() => setActiveTab('action_center')}
          className={`pb-3 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'action_center'
              ? 'text-brand-orange border-b-2 border-brand-orange'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <span>Upcoming Payments & Reminders</span>
          {actionRequiredCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] bg-state-expense/20 text-state-expense rounded-custom-full font-bold">
              {actionRequiredCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('schedules')}
          className={`pb-3 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'schedules'
              ? 'text-brand-orange border-b-2 border-brand-orange'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <span>Schedules Master ({rules.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center py-8">
          <RefreshCw size={24} className="animate-spin text-brand-orange" />
        </div>
      ) : error ? (
        <div className="mt-12 p-4 bg-state-expense/10 border border-state-expense/20 text-state-expense text-sm rounded-custom-md max-w-xl mx-auto flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : activeTab === 'action_center' ? (
        /* TAB 1: ACTION CENTER & UPCOMING PAYMENTS */
        <div className="mt-6 space-y-4">
          <div className="bg-surface-secondary/40 border border-border-neutral rounded-custom-md p-3 text-xs text-text-secondary flex items-start gap-2">
            <HelpCircle size={15} className="text-brand-orange shrink-0 mt-0.5" />
            <span>
              <strong>How it works:</strong> Mark payments as paid when you complete them to automatically record an actual transaction in your account. Skip payments to dismiss reminders without changing balances.
            </span>
          </div>

          {sortedOccurrences.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                icon={<Clock size={32} />}
                title="No Scheduled Reminders"
                description="Upcoming payment reminders generated from your active schedules will appear here."
                actionLabel="Setup First Schedule"
                onAction={() => {
                  setSelectedRule(null)
                  setIsFormOpen(true)
                }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedOccurrences.map((occ) => {
                const derivedState = getDerivedOccurrenceState(occ.due_date, occ.status, todayStr)

                return (
                  <div
                    key={occ.id}
                    className={`bg-surface-primary border rounded-custom-xl p-4 flex flex-col justify-between shadow-sm transition-all ${
                      derivedState === 'overdue'
                        ? 'border-state-expense/40 bg-state-expense/5'
                        : derivedState === 'due_today'
                        ? 'border-brand-orange/40 bg-brand-orange/5'
                        : 'border-border-neutral'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-text-primary">{occ.rule_name}</h4>
                          <p className="text-xs text-text-secondary mt-0.5">
                            Due: <span className="font-mono">{occ.due_date}</span> • {occ.account_name || 'Account'} • {occ.category_name || 'Uncategorized'}
                          </p>
                        </div>

                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-custom-full font-bold uppercase shrink-0 border ${
                            derivedState === 'overdue'
                              ? 'bg-state-expense/15 text-state-expense border-state-expense/30'
                              : derivedState === 'due_today'
                              ? 'bg-brand-orange/15 text-brand-orange border-brand-orange/30'
                              : derivedState === 'confirmed'
                              ? 'bg-state-positive/15 text-state-positive border-state-positive/30'
                              : derivedState === 'skipped'
                              ? 'bg-text-secondary/15 text-text-secondary border-border-neutral'
                              : 'bg-surface-secondary text-text-secondary border-border-neutral'
                          }`}
                        >
                          {derivedState === 'overdue'
                            ? 'Overdue'
                            : derivedState === 'due_today'
                            ? 'Due Today'
                            : derivedState === 'confirmed'
                            ? 'Paid'
                            : derivedState === 'skipped'
                            ? 'Skipped'
                            : 'Upcoming'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-border-neutral/70 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-sm font-bold text-text-primary">
                        {occ.rule_type === 'income' ? '+' : '-'}{formatCurrency(occ.expected_amount)}
                      </div>

                      {occ.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSkipAction(occ.id)}
                            disabled={actionInProgressId === occ.id}
                            title="Skip this reminder without creating a transaction"
                            className="px-3 py-1.5 bg-surface-secondary hover:bg-surface-secondary/80 text-text-secondary text-xs font-semibold rounded-custom-md border border-border-neutral cursor-pointer transition-all min-h-[36px]"
                          >
                            Skip
                          </button>
                          <button
                            onClick={() => handleConfirmAction(occ.id)}
                            disabled={actionInProgressId === occ.id}
                            title="Mark as Paid to record actual transaction in account balance"
                            className="px-3 py-1.5 bg-brand-orange hover:bg-brand-orange-hover text-text-primary text-xs font-semibold rounded-custom-md cursor-pointer transition-all flex items-center gap-1 min-h-[36px]"
                          >
                            <CheckCircle2 size={14} />
                            <span>Mark as Paid</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] text-text-secondary italic">
                          {occ.status === 'confirmed' ? 'Recorded in transaction history' : 'Reminder skipped'}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: SCHEDULES MASTER */
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-2">
              {(['all', 'active', 'paused', 'archived'] as const).map((filterOpt) => (
                <button
                  key={filterOpt}
                  onClick={() => setScheduleFilter(filterOpt)}
                  className={`px-3 py-1.5 rounded-custom-md text-xs font-semibold capitalize transition-all cursor-pointer ${
                    scheduleFilter === filterOpt
                      ? 'bg-brand-orange text-text-primary'
                      : 'bg-surface-primary border border-border-neutral text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {filterOpt}
                </button>
              ))}
            </div>

            <p className="text-xs text-text-secondary">
              Showing {filteredRules.length} of {rules.length} total schedules
            </p>
          </div>

          {filteredRules.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                icon={<Calendar size={32} />}
                title="No Matching Schedules"
                description="No recurring rules found matching the selected filter."
                actionLabel="Create Schedule"
                onAction={() => {
                  setSelectedRule(null)
                  setIsFormOpen(true)
                }}
              />
            </div>
          ) : (
            <div className="bg-surface-primary border border-border-neutral rounded-custom-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse min-w-[650px]">
                  <thead>
                    <tr className="bg-surface-secondary border-b border-border-neutral text-text-secondary text-xs font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">Schedule Name</th>
                      <th className="px-6 py-4">Frequency</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Next Due Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-neutral">
                    {filteredRules.map((rule) => {
                      const accName = accounts.find((a) => a.id === rule.account_id)?.name || 'Account'
                      const catName = categories.find((c) => c.id === rule.category_id)?.name || 'Uncategorized'
                      const isArchived = Boolean(rule.archived_at)

                      return (
                        <tr key={rule.id} className="hover:bg-surface-secondary/50 text-text-primary transition-colors">
                          <td className="px-6 py-4 font-semibold">
                            <div>
                              <div>{rule.name}</div>
                              <div className="text-[10px] text-text-secondary font-normal mt-0.5">
                                {accName} • {catName}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 capitalize text-xs text-text-secondary">{rule.frequency}</td>

                          <td className={`px-6 py-4 font-bold ${rule.transaction_type === 'income' ? 'text-state-positive' : 'text-text-primary'}`}>
                            {rule.transaction_type === 'income' ? '+' : '-'}{formatCurrency(rule.amount)}
                          </td>

                          <td className="px-6 py-4 font-mono text-xs text-text-secondary">
                            {isArchived ? '—' : rule.next_due_date}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`text-[10px] px-2.5 py-0.5 rounded-custom-full font-bold border ${
                                isArchived
                                  ? 'bg-text-secondary/15 border-border-neutral text-text-secondary'
                                  : rule.is_active
                                  ? 'bg-state-positive/15 border-state-positive/30 text-state-positive'
                                  : 'bg-brand-orange/15 border-brand-orange/30 text-brand-orange'
                              }`}
                            >
                              {isArchived ? 'Archived' : rule.is_active ? 'Active' : 'Paused'}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {!isArchived && (
                                <>
                                  {rule.is_active ? (
                                    <button
                                      onClick={() => pauseRule(rule.id)}
                                      title="Pause schedule (stops future reminders)"
                                      className="p-2 hover:bg-surface-secondary rounded-custom-md text-text-secondary hover:text-text-primary cursor-pointer transition-all min-h-[36px]"
                                    >
                                      <Pause size={14} />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => resumeRule(rule.id, rule)}
                                      title="Resume schedule"
                                      className="p-2 hover:bg-surface-secondary rounded-custom-md text-text-secondary hover:text-state-positive cursor-pointer transition-all min-h-[36px]"
                                    >
                                      <Play size={14} />
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleEditClick(rule)}
                                    title="Edit Schedule details"
                                    className="p-2 hover:bg-surface-secondary rounded-custom-md text-text-secondary hover:text-brand-orange cursor-pointer transition-all min-h-[36px]"
                                  >
                                    <Edit2 size={14} />
                                  </button>

                                  <button
                                    onClick={() => handleArchiveClick(rule.id)}
                                    title="Archive Schedule"
                                    className="p-2 hover:bg-surface-secondary rounded-custom-md text-text-secondary hover:text-state-expense cursor-pointer transition-all min-h-[36px]"
                                  >
                                    <Archive size={14} />
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => handleDeleteClick(rule.id)}
                                title="Delete Schedule permanently"
                                className="p-2 hover:bg-surface-secondary rounded-custom-md text-text-secondary hover:text-state-expense cursor-pointer transition-all min-h-[36px]"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Setup / Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-6 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-bold text-text-primary">
                {selectedRule ? 'Edit Schedule Rule' : 'Setup New Schedule Rule'}
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

export default RecurringPage
