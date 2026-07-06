import React, { useState, useEffect, useCallback } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Target, Plus, AlertCircle, RefreshCw, Trash2, Archive, DollarSign, Calendar } from 'lucide-react'
import {
  listGoals,
  createGoal,
  archiveGoal,
  listGoalContributions,
  addGoalContribution,
  deleteGoalContribution
} from '../financial/api/financial-api'
import { validateGoal, validateGoalContribution } from '../financial/validation'
import {
  calculateGoalSavedAmount,
  calculateGoalRemaining,
  calculateGoalProgressPercentage,
  calculateRequiredMonthlySavings,
  calculateRequiredWeeklySavings,
  calculateGoalPaceStatus,
  calculateGoalProjectedCompletionDate,
  calculateGoalRecoveryAmount
} from '../financial/utils/calculations'
import type { Goal, GoalContribution, GoalType } from '../financial/types'

export const GoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([])
  const [contributions, setContributions] = useState<{ [goalId: string]: GoalContribution[] }>({})
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Goal Form State
  const [name, setName] = useState('')
  const [type, setType] = useState<GoalType>('monthly_savings')
  const [targetAmount, setTargetAmount] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [targetDate, setTargetDate] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  // Contribution Form State (indexed by goalId)
  const [contribGoalId, setContribGoalId] = useState<string | null>(null)
  const [contribAmount, setContribAmount] = useState('')
  const [contribDate, setContribDate] = useState(new Date().toISOString().split('T')[0])
  const [contribNotes, setContribNotes] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const goalsList = await listGoals()
      setGoals(goalsList)

      // Fetch contributions for all goals
      const contribsMap: { [goalId: string]: GoalContribution[] } = {}
      await Promise.all(
        goalsList.map(async (g) => {
          const contribs = await listGoalContributions(g.id)
          contribsMap[g.id] = contribs
        })
      )
      setContributions(contribsMap)
    } catch (err: unknown) {
      console.error('Error fetching goals details:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch goals records.')
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

  const handleSubmitGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const targetNum = parseFloat(targetAmount) || 0
    const validationErr = validateGoal(name, targetNum, startDate, targetDate, type)
    if (validationErr) {
      setFormError(validationErr)
      return
    }

    setActionLoading(true)
    try {
      await createGoal({
        name: name.trim(),
        goal_type: type,
        target_amount: targetNum,
        start_date: startDate,
        target_date: targetDate,
        status: 'active',
      })
      setName('')
      setTargetAmount('')
      setTargetDate('')
      await fetchData()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create goal.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to archive this goal?')) return
    setActionLoading(true)
    try {
      await archiveGoal(id)
      await fetchData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to archive goal.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddContribution = async (e: React.FormEvent, goalId: string) => {
    e.preventDefault()
    setFormError(null)

    const amtNum = parseFloat(contribAmount) || 0
    const validationErr = validateGoalContribution(amtNum, contribDate)
    if (validationErr) {
      alert(validationErr)
      return
    }

    setActionLoading(true)
    try {
      await addGoalContribution({
        goal_id: goalId,
        amount: amtNum,
        contribution_date: contribDate,
        notes: contribNotes.trim() || null,
      })
      setContribAmount('')
      setContribNotes('')
      setContribGoalId(null)
      await fetchData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to log goal contribution.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteContribution = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contribution?')) return
    setActionLoading(true)
    try {
      await deleteGoalContribution(id)
      await fetchData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete contribution.')
    } finally {
      setActionLoading(false)
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(val)
  }

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <PageContainer>
      <PageHeader
        title="Goals"
        description="Set and track progress towards your financial savings goals."
      />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Goal Form Card */}
        <div className="bg-surface-primary border border-border-neutral rounded-custom-lg p-6 h-fit">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <Plus size={18} className="text-brand-purple" /> Create Goal
          </h3>

          {formError && (
            <div className="mb-4 p-3 bg-state-expense/10 border border-state-expense/20 text-state-expense rounded-custom-md flex items-start gap-2 text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitGoal} className="space-y-4">
            <div>
              <label htmlFor="goal-name" className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
                Goal Name
              </label>
              <input
                id="goal-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Emergency Fund"
                disabled={actionLoading}
                className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2.5 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
              />
            </div>

            <div>
              <label htmlFor="goal-type" className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
                Goal Type
              </label>
              <select
                id="goal-type"
                value={type}
                onChange={(e) => setType(e.target.value as GoalType)}
                disabled={actionLoading}
                className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2.5 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
              >
                <option value="monthly_savings">Monthly Savings</option>
                <option value="financial_year">Financial Year</option>
                <option value="personal">Personal Specific</option>
              </select>
            </div>

            <div>
              <label htmlFor="goal-target" className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
                Target Amount (INR)
              </label>
              <input
                id="goal-target"
                type="number"
                required
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0.00"
                disabled={actionLoading}
                className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2.5 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="goal-start" className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
                  Start Date
                </label>
                <input
                  id="goal-start"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={actionLoading}
                  className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
                />
              </div>

              <div>
                <label htmlFor="goal-target-date" className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
                  Target Date
                </label>
                <input
                  id="goal-target-date"
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  disabled={actionLoading}
                  className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-2.5 bg-brand-purple hover:bg-brand-purple/90 text-text-primary font-medium text-sm rounded-custom-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {actionLoading ? 'Saving...' : 'Add Goal'}
            </button>
          </form>
        </div>

        {/* Goals List & Details Column */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-text-secondary gap-2">
              <RefreshCw size={18} className="animate-spin" />
              <span>Loading goals...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-state-expense/10 border border-state-expense/20 text-state-expense rounded-custom-md text-sm text-center">
              {error}
            </div>
          ) : goals.length === 0 ? (
            <EmptyState
              title="No Goals Found"
              description="Establish your savings targets and long term goals on the left."
              icon={<Target size={32} className="text-brand-purple" />}
            />
          ) : (
            <div className="space-y-6">
              {goals.map((g) => {
                const contribs = contributions[g.id] || []
                const saved = calculateGoalSavedAmount(contribs)
                const remaining = calculateGoalRemaining(g.target_amount, saved)
                const progress = calculateGoalProgressPercentage(g.target_amount, saved)
                const reqMonthly = calculateRequiredMonthlySavings(remaining, g.target_date, todayStr)
                const reqWeekly = calculateRequiredWeeklySavings(remaining, g.target_date, todayStr)
                const paceStatus = calculateGoalPaceStatus(g, saved, todayStr)
                const projectedCompletion = calculateGoalProjectedCompletionDate(g.start_date, saved, g.target_amount, todayStr, g.target_date)
                const recoveryMonthly = calculateGoalRecoveryAmount(remaining, g.target_date, todayStr)

                return (
                  <div
                    key={g.id}
                    className={`bg-surface-primary border rounded-custom-lg p-6 space-y-4 hover:border-text-muted transition-all ${
                      g.status === 'archived' ? 'border-border-neutral opacity-50 bg-surface-secondary' : 'border-border-neutral'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-text-primary text-base flex items-center gap-2">
                          {g.name}
                          {g.status === 'active' && (
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                              paceStatus === 'ahead' ? 'bg-state-positive/10 text-state-positive border-state-positive/20' :
                              paceStatus === 'behind' ? 'bg-state-expense/10 text-state-expense border-state-expense/20' :
                              'bg-brand-purple/10 text-brand-purple border-brand-purple/20'
                            }`}>
                              {paceStatus === 'ahead' ? 'Ahead' : paceStatus === 'behind' ? 'Behind' : 'On Track'}
                            </span>
                          )}
                          {g.status === 'archived' && (
                            <span className="text-[9px] bg-surface-secondary text-text-secondary px-2 py-0.5 rounded border border-border-neutral uppercase">
                              Archived
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-text-secondary mt-1 capitalize">
                          Type: {g.goal_type.replace('_', ' ')} | Start: {g.start_date} | Target: {g.target_date}
                        </p>
                      </div>

                      {g.status === 'active' && (
                        <button
                          onClick={() => handleArchive(g.id)}
                          title="Archive Goal"
                          className="p-2 text-text-secondary hover:text-brand-purple hover:bg-surface-secondary rounded transition-colors cursor-pointer border-none bg-transparent"
                        >
                          <Archive size={16} />
                        </button>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-text-secondary">Progress</span>
                        <span className="text-brand-purple">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-surface-secondary rounded-full overflow-hidden border border-border-neutral">
                        <div
                          className="h-full bg-brand-purple transition-all duration-300"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-text-muted">
                        <span>Saved: {formatCurrency(saved)}</span>
                        <span>Target: {formatCurrency(g.target_amount)}</span>
                      </div>
                    </div>

                    {/* Projections */}
                    {remaining > 0 && g.status === 'active' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 bg-surface-secondary p-3 rounded-custom-md border border-border-neutral text-xs">
                          <div className="flex items-center gap-2">
                            <DollarSign size={14} className="text-brand-purple" />
                            <div>
                              <p className="text-text-muted uppercase text-[9px] font-bold">Monthly Target</p>
                              <p className="font-bold text-text-primary mt-0.5">{formatCurrency(reqMonthly)} / mo</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-brand-purple" />
                            <div>
                              <p className="text-text-muted uppercase text-[9px] font-bold">Weekly Target</p>
                              <p className="font-bold text-text-primary mt-0.5">{formatCurrency(reqWeekly)} / wk</p>
                            </div>
                          </div>
                        </div>

                        {/* Forecasts & Recovery alert */}
                        <div className="bg-surface-secondary/40 border border-border-neutral/60 p-3 rounded-custom-md text-xs space-y-1.5">
                          <div className="flex justify-between text-text-secondary">
                            <span>Projected Completion:</span>
                            <span className="font-semibold text-text-primary">
                              {projectedCompletion ? new Date(projectedCompletion).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never (Zero Rate)'}
                            </span>
                          </div>

                          {paceStatus === 'behind' && (
                            <div className="pt-1.5 border-t border-border-neutral/40 flex items-start gap-1 text-[11px] text-state-expense font-semibold">
                              <span>⚠️ Behind pace. Need {formatCurrency(recoveryMonthly)}/mo to restore timeline.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Contributions Log & Logger Sub-form */}
                    {g.status === 'active' && (
                      <div className="pt-2 border-t border-border-neutral">
                        {contribGoalId === g.id ? (
                          <form onSubmit={(e) => handleAddContribution(e, g.id)} className="space-y-3">
                            <p className="text-xs font-bold text-text-secondary uppercase">Log Contribution</p>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="number"
                                step="0.01"
                                required
                                placeholder="Amount"
                                value={contribAmount}
                                onChange={(e) => setContribAmount(e.target.value)}
                                className="bg-surface-secondary border border-border-neutral rounded-custom-md px-3 py-1.5 text-xs text-text-primary outline-none focus:border-brand-purple"
                              />
                              <input
                                type="date"
                                required
                                value={contribDate}
                                onChange={(e) => setContribDate(e.target.value)}
                                className="bg-surface-secondary border border-border-neutral rounded-custom-md px-3 py-1.5 text-xs text-text-primary outline-none focus:border-brand-purple"
                              />
                            </div>
                            <input
                              type="text"
                              placeholder="Notes (optional)"
                              value={contribNotes}
                              onChange={(e) => setContribNotes(e.target.value)}
                              className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-3 py-1.5 text-xs text-text-primary outline-none focus:border-brand-purple"
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => setContribGoalId(null)}
                                className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary cursor-pointer border-none bg-transparent"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-text-primary text-xs font-semibold rounded-custom-md cursor-pointer border-none"
                              >
                                Log Savings
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-text-secondary font-medium">Goal Contributions ({contribs.length})</span>
                            <button
                              onClick={() => {
                                setContribGoalId(g.id)
                                setContribAmount('')
                              }}
                              className="text-brand-purple hover:text-brand-purple/80 font-bold transition-colors cursor-pointer bg-transparent border-none outline-none"
                            >
                              + Contribute Savings
                            </button>
                          </div>
                        )}

                        {/* Contributions Entries */}
                        {contribs.length > 0 && (
                          <div className="mt-3 space-y-2 max-h-36 overflow-y-auto">
                            {contribs.map((c) => (
                              <div
                                key={c.id}
                                className="bg-surface-secondary/50 border border-border-neutral/50 rounded-custom-md p-2 flex items-center justify-between text-xs"
                              >
                                <div>
                                  <p className="font-semibold text-text-primary">
                                    {formatCurrency(c.amount)}
                                    {c.notes && <span className="text-text-muted font-normal italic ml-2">({c.notes})</span>}
                                  </p>
                                  <p className="text-[10px] text-text-secondary mt-0.5">{c.contribution_date}</p>
                                </div>
                                <button
                                  onClick={() => handleDeleteContribution(c.id)}
                                  className="text-text-muted hover:text-state-expense cursor-pointer border-none bg-transparent p-1"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

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
